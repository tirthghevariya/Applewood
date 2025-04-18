import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import {
  Button,
  Input,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tooltip,
} from "reactstrap";
import { registerAllModules } from 'handsontable/registry';
import { doc, updateDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../../firebase";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { showToast } from "../../slices/toast/reducer";
import { useDispatch } from "react-redux";

import leftArrow from "../../assets/images/left.png";
import upArrow from "../../assets/images/up.png";
import rightArrow from "../../assets/images/right.png";
import downArrow from "../../assets/images/down.png";
import { FixedSizeList as List } from 'react-window';

const InchesToMM = () => {
  const navigate = useNavigate();
  const [batchNumber, setBatchNumber] = useState(0);
  const [tools, setTools] = useState(0);
  const [edge, setEdge] = useState(0);
  const dispatch = useDispatch();
  const [isSpecial, setIsSpecial] = useState(false);

  const [tooltipOpen, setTooltipOpen] = useState(false);
  registerAllModules();

  const arrowMap = {
    1: leftArrow,
    2: downArrow,
    3: rightArrow,
    5: upArrow,
  };

  const [tableData, setTableData] = useState([
    ["WIDTH", "HEIGHT", "PCS", "REMARK", "REMARK 2", "WIDTH(MM)", "HEIGHT(MM)", "PCS"],
    ...Array(100).fill(["", "", "", "", "", "", "", ""]),
  ]);

  const formatDateToDMY = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const [date, setDate] = useState(formatDateToDMY(new Date()));
  const [clientName, setClientName] = useState("");
  const [book, setBook] = useState("");
  const [selectedColor, setSelectedColor] = useState("AW_301");
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profileValue, setProfileValue] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [field1, setField1] = useState(tools.toString());
  const [field2, setField2] = useState(edge.toString());
  const [luminate, setLuminate] = useState("");
  const [isLuminateFieldVisible, setIsLuminateFieldVisible] = useState(false);

  const toggleTooltip = () => setTooltipOpen(!tooltipOpen);

  useEffect(() => {
    const fetchBatchNumber = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "batchNumber"));
        const batchData = querySnapshot.docs[0]?.data();
        if (batchData && batchData.batchNumber) {
          setBatchNumber(parseFloat(batchData.batchNumber));
          setTools(parseFloat(batchData.tools));
          setEdge(parseFloat(batchData.edgeBand));
        }
      } catch (error) {
        console.error("Error fetching batch number:", error);
      }
    };

    // Fetch batch number
    fetchBatchNumber();

    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData || !userData.username) {
      navigate("/login");
      return;
    }

    // Check for super admin user and redirect if applicable
    const superAdminUser = JSON.parse(localStorage.getItem("superAdminUser"));
    if (superAdminUser && superAdminUser?.userType === "main_admin") {
      navigate("/entries");
      return; // Prevents setting fields if navigating away
    }

    // Set fields based on tools and edge values
    setField1(tools.toString());
    setField2(edge.toString());
  }, [navigate, tools, edge]);


  const addColumn = () => {
    const newTableData = tableData.map((row, index) => {
      if (index === 0) {
        return [...row, ""];
      }
      return [...row, ""];
    });
    setTableData(newTableData);
  };

  const addRow = () => {
    const newRows = Array(50).fill(Array(tableData[0].length).fill(""));

    setTableData((prevData) => [...prevData, ...newRows]);
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      [`Date: ${date}`, `Client: ${clientName}`, `Book: ${book}`],
      [],
      ...tableData,
    ]);
    const sanitizedClientName = clientName?.toString().toLowerCase() || "client";
    const fileName = `${sanitizedClientName}_${date}_"Inches".xlsx`;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, fileName);
  };

  const workPDF = async () => {
    if (!clientName) {
      dispatch(
        showToast({
          type: "error",
          msg: "Please enter client name",
        })
      );
      return;
    }

    const safeTableData = Array.isArray(tableData)
      ? tableData
      : [["WIDTH", "HEIGHT", "PCS", "REMARK", "REMARK 2", "WIDTH(MM)", "HEIGHT(MM)", "PCS(FINAL)"]];

    const headers = [...safeTableData[0]];
    const remarkIndex = headers.indexOf("REMARK");
    const remark2Index = headers.indexOf("REMARK 2");

    if (remarkIndex > -1 && remark2Index > -1) {
      headers.splice(remarkIndex, 1);
      headers.splice(remark2Index - 1, 1);
      headers.push("REMARK", "REMARK 2");
    }

    const reorderedData = safeTableData.slice(1).map((row) => {
      const remarkValue = row[remarkIndex];
      const remark2Value = row[remark2Index];
      const newRow = [...row];
      newRow.splice(remarkIndex, 1);
      newRow.splice(remark2Index - 1, 1);
      newRow.push(remarkValue, remark2Value);
      return newRow;
    });

    const sortOrder = [
      "fix", "", "profile", "1", "2", "3", "5",
      "glass", "figure", "cross", "j cross",
      "d cross", "upar cross", "niche cross", "Drawer"
    ];

    const orderedData = reorderedData.sort((a, b) => {
      const remarkA = (a[headers.indexOf("REMARK")] || "").toLowerCase();
      const remarkB = (b[headers.indexOf("REMARK")] || "").toLowerCase();
      const indexA = sortOrder.indexOf(remarkA) > -1 ? sortOrder.indexOf(remarkA) : sortOrder.length;
      const indexB = sortOrder.indexOf(remarkB) > -1 ? sortOrder.indexOf(remarkB) : sortOrder.length;
      return indexA - indexB;
    });

    const filteredData = orderedData
      .filter((row) => row.some((cell) => cell && cell.trim() !== ""));

    const arrowImages = {
      1: await fetchImageAsBase64(leftArrow),
      2: await fetchImageAsBase64(downArrow),
      3: await fetchImageAsBase64(rightArrow),
      5: await fetchImageAsBase64(upArrow),
    };

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    doc.text(`Date: ${date}`, 10, 10);
    doc.text(`Client: ${clientName}`, 10, 20);
    doc.text(`Book: ${book}`, 10, 30);

    if (luminate) {
      doc.text(`Luminate No: ${luminate}`, 10, 40);
    }

    const selectedColorImage = colorImages[selectedColor.replace(" ", "_")] || null;
    let colorImageBase64 = null;

    if (selectedColorImage) {
      colorImageBase64 = await fetchImageAsBase64(selectedColorImage);
    }

    let tableStartY = 50;
    if (colorImageBase64) {
      doc.addImage(colorImageBase64, "PNG", 130, 0, 40, 50);
    }

    // Step 1: Filter out empty columns
    const columnsToKeep = headers.reduce((acc, header, colIndex) => {
      const hasData = filteredData.some(row => {
        const cell = row[colIndex];
        return cell && cell.toString().trim() !== "";
      });
      if (hasData) acc.push(colIndex);
      return acc;
    }, []);

    // Step 2: Rebuild headers and filtered data
    const filteredHeaders = headers.filter((_, index) => columnsToKeep.includes(index));
    const cleanedData = filteredData.map(row => columnsToKeep.map(i => row[i]));

    // Step 3: Add Serial Numbers
    const serialData = cleanedData.map((row, index) => [index + 1, ...row]);
    const finalHeaders = ["S. No", ...filteredHeaders];

    doc.autoTable({
      head: [finalHeaders],
      body: serialData,
      startY: tableStartY,
      styles: { fontSize: 10 },
      theme: "grid",
      headStyles: { fillColor: [22, 160, 133] },

      didDrawCell: (data) => {
        if (!data || !data.row || !data.cell) return;

        const remarkColumnIndex = finalHeaders.indexOf("REMARK");
        const remark2ColumnIndex = finalHeaders.indexOf("REMARK 2");
        // Draw vertical bold line between PCS and WIDTH(MM)
        const pcsIndex = finalHeaders.indexOf("PCS");
        if (data.column.index === pcsIndex) {
          const { x, y, height } = data.cell;

          // Draw bold line on the right side of PCS cell
          doc.setDrawColor(0);
          doc.setLineWidth(0.8); // Thicker line
          doc.line(x + data.cell.width, y, x + data.cell.width, y + height);
          doc.setLineWidth(0.1); // Reset to normal
        }

        if (data.column.index === remarkColumnIndex || data.column.index === remark2ColumnIndex) {
          const cellText = data.cell.raw;
          const remarkImage = arrowImages[cellText];

          if (remarkImage) {
            doc.setFillColor(255, 255, 255); // Clear background
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");

            // Add the image centered in the cell
            const cellWidth = data.cell.width;
            const cellHeight = data.cell.height;
            const maxImageSize = Math.min(cellWidth, cellHeight) - 4;
            const imageWidth = maxImageSize;
            const imageHeight = maxImageSize;

            doc.addImage(
              remarkImage,
              "PNG",
              data.cell.x + (cellWidth - imageWidth) / 2,
              data.cell.y + (cellHeight - imageHeight) / 2,
              imageWidth,
              imageHeight
            );
            doc.setDrawColor(180);
            doc.setLineWidth(0.1);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "S");
          }
        }
      }
    });

    const pcsIndex = headers.indexOf("PCS");
    const totalPCS = serialData.reduce((sum, row) => {
      const pcsValue = parseFloat(row[pcsIndex + 1]) || 0;
      return sum + pcsValue;
    }, 0);

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total PCS: ${totalPCS}`, 10, finalY);

    const sanitizedClientName = clientName.toString().toLowerCase();
    doc.save(`${sanitizedClientName}${date}.pdf`);
  };

  const normalPDF = async () => {
    if (!clientName) {
      dispatch(
        showToast({
          type: "error",
          msg: "Please enter client name",
        })
      );
      return;
    }

    const safeTableData = Array.isArray(tableData)
      ? tableData
      : [
        [
          "WIDTH",
          "HEIGHT",
          "PCS",
          "REMARK",
          "REMARK 2",
          "WIDTH(MM)",
          "HEIGHT(MM)",
          "PCS(FINAL)",
        ],
      ];

    const headers = [...safeTableData[0]];
    const remarkIndex = headers.indexOf("REMARK");
    const remark2Index = headers.indexOf("REMARK 2");

    if (remarkIndex > -1 && remark2Index > -1) {
      headers.splice(remarkIndex, 1);
      headers.splice(remark2Index - 1, 1);
      headers.push("REMARK", "REMARK 2");
    }

    const reorderedData = safeTableData.slice(1).map((row) => {
      const remarkValue = row[remarkIndex];
      const remark2Value = row[remark2Index];
      const newRow = [...row];
      if (remarkIndex > -1) {
        newRow.splice(remarkIndex, 1);
      }
      if (remark2Index > -1) {
        newRow.splice(remark2Index - 1, 1);
      }
      newRow.push(remarkValue, remark2Value);
      return newRow;
    });


    const filteredData = reorderedData
      .filter((row) => row.some((cell) => cell && cell.trim() !== ""));

    const arrowImages = {
      1: await fetchImageAsBase64(leftArrow),
      2: await fetchImageAsBase64(downArrow),
      3: await fetchImageAsBase64(rightArrow),
      5: await fetchImageAsBase64(upArrow),
    };

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Date: ${date}`, 10, 10);
    doc.text(`Client: ${clientName}`, 10, 20);
    doc.text(`Book: ${book}`, 10, 30);

    if (luminate) {
      doc.text(`Luminate No: ${luminate}`, 10, 40);
    }

    const selectedColorImage =
      colorImages[selectedColor.replace(" ", "_")] || null;
    let colorImageBase64 = null;
    if (selectedColorImage) {
      colorImageBase64 = await fetchImageAsBase64(selectedColorImage);
    }

    if (colorImageBase64) {
      const imageWidth = 40;
      const imageHeight = 50;
      const imageXPosition = 130;

      doc.addImage(
        colorImageBase64,
        "PNG",
        imageXPosition,
        0,
        imageWidth,
        imageHeight
      );

      const colorCodeText = `Color Code: ${selectedColor.split(".")[0]}`;
      doc.text(colorCodeText, imageXPosition, imageHeight + 5);
    }

    let tableStartY = 50;
    if (colorImageBase64) {
      doc.addImage(colorImageBase64, "PNG", 130, 0, 40, 50);
    }

    // Step 1: Filter out empty columns
    const columnsToKeep = headers.reduce((acc, header, colIndex) => {
      const hasData = filteredData.some(row => {
        const cell = row[colIndex];
        return cell && cell.toString().trim() !== "";
      });
      if (hasData) acc.push(colIndex);
      return acc;
    }, []);

    // Step 2: Rebuild headers and filtered data
    const filteredHeaders = headers.filter((_, index) => columnsToKeep.includes(index));
    const cleanedData = filteredData.map(row => columnsToKeep.map(i => row[i]));

    // Step 3: Add Serial Numbers
    const serialData = cleanedData.map((row, index) => [index + 1, ...row]);
    const finalHeaders = ["S. No", ...filteredHeaders];

    doc.autoTable({
      head: [finalHeaders],
      body: serialData,
      startY: tableStartY,
      styles: { fontSize: 10 },
      theme: "grid",
      headStyles: { fillColor: [22, 160, 133] },

      didDrawCell: (data) => {
        if (!data || !data.row || !data.cell) return;

        const remarkColumnIndex = finalHeaders.indexOf("REMARK");
        const remark2ColumnIndex = finalHeaders.indexOf("REMARK 2");
        // Draw vertical bold line between PCS and WIDTH(MM)
        const pcsIndex = finalHeaders.indexOf("PCS");
        if (data.column.index === pcsIndex) {
          const { x, y, height } = data.cell;

          // Draw bold line on the right side of PCS cell
          doc.setDrawColor(0);
          doc.setLineWidth(0.8); // Thicker line
          doc.line(x + data.cell.width, y, x + data.cell.width, y + height);
          doc.setLineWidth(0.1); // Reset to normal
        }

        if (data.column.index === remarkColumnIndex || data.column.index === remark2ColumnIndex) {
          const cellText = data.cell.raw;
          const remarkImage = arrowImages[cellText];

          if (remarkImage) {
            doc.setFillColor(255, 255, 255); // Clear background
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");

            // Add the image centered in the cell
            const cellWidth = data.cell.width;
            const cellHeight = data.cell.height;
            const maxImageSize = Math.min(cellWidth, cellHeight) - 4;
            const imageWidth = maxImageSize;
            const imageHeight = maxImageSize;

            doc.addImage(
              remarkImage,
              "PNG",
              data.cell.x + (cellWidth - imageWidth) / 2,
              data.cell.y + (cellHeight - imageHeight) / 2,
              imageWidth,
              imageHeight
            );

            // ✅ Redraw the border with soft color and thin line
            doc.setDrawColor(180); // light gray
            doc.setLineWidth(0.1); // thinner line
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "S");
          }
        }
      }

    });

    const pcsIndex = headers.indexOf("PCS");
    const totalPCS = serialData.reduce((sum, row) => {
      const pcsValue = parseFloat(row[pcsIndex + 1]) || 0;
      return sum + pcsValue;
    }, 0);

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Total PCS: ${totalPCS}`, 10, finalY);
    const sanitizedClientName = clientName.toString().toLowerCase();
    doc.save(`${sanitizedClientName}${date}.pdf`);
  };

  const fetchImageAsBase64 = async (imagePath) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = imagePath;
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL("image/png");
        resolve(base64);
      };
      img.onerror = (error) => reject(error);
    });
  };

  const printPDF = async () => {
    const remarkMapping = {
      c: "Cross",
      f: "Fix",
      p: "Profile",
      j: "J Cross",
      d: "D Cross",
      u: "Upar Cross",
      n: "Niche Cross",
      g: "Glass",
      fi: "Figure",
      ar: "Drawer",
    };

    if (!clientName) {
      dispatch(
        showToast({
          type: "error",
          msg: "Please enter client name",
        })
      );
      return;
    }

    const safeTableData = Array.isArray(tableData)
      ? tableData
      : [
        [
          "WIDTH",
          "HEIGHT",
          "PCS",
          "REMARK",
          "REMARK 2",
          "WIDTH(MM)",
          "HEIGHT(MM)",
          "PCS(FINAL)",
        ],
      ];

    const headers = [...safeTableData[0]];
    const remarkIndex = headers.indexOf("REMARK");
    const remark2Index = headers.indexOf("REMARK 2");

    if (remarkIndex > -1 && remark2Index > -1) {
      headers.splice(remarkIndex, 1);
      headers.splice(remark2Index - 1, 1);
      headers.push("REMARK", "REMARK 2");
    }

    const reorderedData = safeTableData.slice(1).map((row) => {
      const remarkValue = row[remarkIndex];
      const remark2Value = row[remark2Index];
      const newRow = [...row];
      const mapRemark = (value) => {
        if (!value) return "";
        const key = value.replace("+", "").toLowerCase();
        return remarkMapping[key] || value;
      };

      if (remarkIndex > -1) {
        newRow.splice(remarkIndex, 1);
      }
      if (remark2Index > -1) {
        newRow.splice(remark2Index - 1, 1);
      }
      newRow.push(mapRemark(remarkValue), mapRemark(remark2Value));
      return newRow;
    });

    const filteredData = reorderedData.filter((row) =>
      row.some((cell) => cell && cell.trim() !== "")
    );

    const arrowImages = {
      1: await fetchImageAsBase64(leftArrow),
      2: await fetchImageAsBase64(downArrow),
      3: await fetchImageAsBase64(rightArrow),
      5: await fetchImageAsBase64(upArrow),
    };

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Date: ${date}`, 10, 10);
    doc.text(`Client: ${clientName}`, 10, 20);
    doc.text(`Book: ${book}`, 10, 30);

    if (luminate) {
      doc.text(`Luminate No: ${luminate}`, 10, 40);
    }

    const selectedColorImage =
      colorImages[selectedColor.replace(" ", "_")] || null;
    let colorImageBase64 = null;
    if (selectedColorImage) {
      colorImageBase64 = await fetchImageAsBase64(selectedColorImage);
    }

    if (colorImageBase64) {
      const imageWidth = 40;
      const imageHeight = 50;
      const imageXPosition = 130;

      doc.addImage(
        colorImageBase64,
        "PNG",
        imageXPosition,
        0,
        imageWidth,
        imageHeight
      );
    }

    let tableStartY = 50;
    if (colorImageBase64) {
      doc.addImage(colorImageBase64, "PNG", 130, 0, 40, 50);
    }
    // Step 1: Filter out empty columns
    const columnsToKeep = headers.reduce((acc, header, colIndex) => {
      const hasData = filteredData.some(row => {
        const cell = row[colIndex];
        return cell && cell.toString().trim() !== "";
      });
      if (hasData) acc.push(colIndex);
      return acc;
    }, []);

    // Step 2: Rebuild headers and filtered data
    const filteredHeaders = headers.filter((_, index) => columnsToKeep.includes(index));
    const cleanedData = filteredData.map(row => columnsToKeep.map(i => row[i]));

    // Step 3: Add Serial Numbers
    const serialData = cleanedData.map((row, index) => [index + 1, ...row]);
    const finalHeaders = ["S. No", ...filteredHeaders];

    doc.autoTable({
      head: [finalHeaders],
      body: serialData,
      startY: tableStartY,
      styles: { fontSize: 10 },
      theme: "grid",
      headStyles: { fillColor: [22, 160, 133] },

      didDrawCell: (data) => {
        if (!data || !data.row || !data.cell) return;

        const remarkColumnIndex = finalHeaders.indexOf("REMARK");
        const remark2ColumnIndex = finalHeaders.indexOf("REMARK 2");

        // Draw vertical bold line between PCS and WIDTH(MM)
        const pcsIndex = finalHeaders.indexOf("PCS");
        if (data.column.index === pcsIndex) {
          const { x, y, height } = data.cell;

          // Draw bold line on the right side of PCS cell
          doc.setDrawColor(0);
          doc.setLineWidth(0.8); // Thicker line
          doc.line(x + data.cell.width, y, x + data.cell.width, y + height);
          doc.setLineWidth(0.1); // Reset to normal
        }

        // Your existing arrow logic remains unchanged
        if (
          data.column.index === remarkColumnIndex ||
          data.column.index === remark2ColumnIndex
        ) {
          const cellText = data.cell.raw ? String(data.cell.raw) : "";
          if (!cellText) return;

          const containsPlus = cellText.includes("+");
          const baseKey = cellText.replace("+", "").trim();
          const arrowImage = arrowImages[baseKey];

          if (arrowImage) {
            const { x, y, width, height } = data.cell;

            // Clear the text
            doc.setFillColor(255, 255, 255);
            doc.rect(x, y, width, height, "F");

            // Draw border
            doc.setDrawColor(180, 180, 180);
            doc.rect(x, y, width, height, "S");

            // Add image
            const maxImageSize = Math.min(width, height) - 4;
            const imageWidth = maxImageSize;
            const imageHeight = maxImageSize;

            doc.addImage(
              arrowImage,
              "PNG",
              x + (width - imageWidth) / 2,
              y + (height - imageHeight) / 2,
              imageWidth,
              imageHeight
            );
          } else if (containsPlus) {
            doc.setFillColor(240, 230, 140); // Yellow
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");

            // Redraw border
            doc.setDrawColor(0);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "S");
          }
        }
      },

    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total PCS: ${serialData.reduce(
        (sum, row) => sum + (parseFloat(row[3]) || 0),
        0
      )}`,
      10,
      finalY
    );
    window.open(doc.output("bloburl"));
  };

  const convertValue = (value, batchNumber) => {

    if (typeof value === "string") {
      const partss = value.split("/");

      if (partss.length === 2) {

        const calculatePart = (part) => {
          const partParts = part.split(".");
          const whole = parseFloat(partParts[0]) || 0;
          const fractional = parseFloat(partParts.slice(1).join(".")) || 0;
          const wholeCalc = whole * 25.4;
          const fractionalCalc = fractional * 3.17;
          return wholeCalc + fractionalCalc + batchNumber;
        };

        const firstCalc = calculatePart(partss[0]).toFixed(1);
        const secondCalc = calculatePart(partss[1]).toFixed(1);
        return `${firstCalc}/${secondCalc}`;
      }
      const parts = value.split(".");

      if (parts.length === 2 && parts[1].length === 1) {
        const wholeNumber = parseFloat(parts[0]) || 0;
        const fractionalNumber = parseFloat(parts[1]) || 0;
        const wholeCalc = wholeNumber * 25.4;
        const fractionalCalc = fractionalNumber * 3.17;
        return (wholeCalc + fractionalCalc + batchNumber).toFixed(1);
      } else if (parts.length > 2) {
        const wholeNumber = parseFloat(parts[0]) || 0;
        const fractionalNumber = parseFloat(parts.slice(1).join(".")) || 0;
        const fractionalCalc = fractionalNumber * 3.17;
        return (wholeNumber * 25.4 + fractionalCalc + batchNumber).toFixed(1);
      } else if (parts.length === 2) {
        const wholeNumber = parseFloat(parts[0]) || 0;
        const fractionalNumber = parseFloat(`0.${parts[1]}`) || 0;
        const wholeCalc = wholeNumber * 25.4;
        const fractionalCalc = fractionalNumber * 3.17;
        return (wholeCalc + fractionalCalc + batchNumber).toFixed(1);
      }
    }

    if (!isNaN(value)) {
      return (value * 25.4 + batchNumber).toFixed(2);
    }

    return batchNumber.toFixed(2);
  };

  const importFile = () => {

    const input = document.createElement("input");

    input.type = "file";

    input.accept = ".xlsx, .xls";

    input.style.display = "none";



    input.addEventListener("change", (event) => {

      const file = event.target.files[0];

      if (!file) return;



      const reader = new FileReader();



      reader.onload = (e) => {

        const data = new Uint8Array(e.target.result);

        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];

        const sheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Convert to array of arrays



        if (jsonData.length > 1) {

          const [, ...rows] = jsonData; // Skip the first row (headers) and get the remaining rows

          const updatedData = [

            ...tableData.slice(0, 1), // Keep the original header row

            ...rows, // Add the rows from the Excel file

            ...Array(300 - rows.length).fill(["", "", "", "", "", "", ""]), // Fill remaining rows with empty data

          ];



          setTableData(updatedData);



          // Trigger handleTableChange for imported rows

          rows.forEach((rowData, rowIndex) => {

            const row = rowIndex + 1; // Adjust for headers

            rowData.forEach((cellValue, colIndex) => {

              handleTableChange([[row, colIndex, tableData[row]?.[colIndex], cellValue]], "import");

            });

          });

        }

      };



      reader.readAsArrayBuffer(file);

    });

    input.click();

  };

  const handleTableChange = (changes, source) => {
    if (changes && source !== "loadData") {
      setTableData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData));

        changes.forEach(([row, col, oldValue, newValue]) => {
          if (newValue !== oldValue) {
            const isSpecialValue = /aw/i.test(newValue) || newValue === "+";
            setIsSpecial(isSpecialValue);

            if (col === 3 || col === 4) {
              const placeholderMap = {
                c: "Cross",
                f: "Fix",
                p: "Profile",
                j: "J Cross",
                d: "D Cross",
                u: "Upar Cross",
                n: "Niche Cross",
                g: "Glass",
                fi: "Figure",
                ar: "Drawer"
              };
              if (typeof newValue === "string") {
                const match = newValue.match(/^([a-z]+)?\.?(\d+)?$/i);
                let text = "";
                let number = "";

                if (match) {
                  const key = match[1]?.toLowerCase();
                  const num = match[2];

                  if (key && placeholderMap[key]) {
                    text = placeholderMap[key];
                  }

                  if (num && ["1", "2", "3", "5"].includes(num)) {
                    number = num;
                  }
                }

                if (text || number) {
                  newData[row][col] = text && number ? `${text} ${number}` : text || number;
                } else {
                  newData[row][col] = newValue;
                }
              } else {
                newData[row][col] = newValue;
              }
            } else {
              newData[row][col] = newValue;
            }

            // Ensure calculations for other columns remain unchanged
            if (!isSpecialValue) {
              if (col === 0) {
                newData[row][5] = newValue?.trim() ? convertValue(newValue, batchNumber) : "";
              }
              if (col === 1) {
                newData[row][6] = newValue?.trim() ? convertValue(newValue, batchNumber) : "";
              }
              if (col === 2) {
                newData[row][7] = newValue;
              }
            } else {
              if (col === 0) {
                newData[row][5] = "";
              }
              if (col === 1) {
                newData[row][6] = "";
              }
            }
          }
        });

        return newData;
      });
    }
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleFormSubmit = async () => {
    const toolsValue = parseFloat(field1);
    const edgeBandValue = parseFloat(field2);

    if (isNaN(toolsValue) || isNaN(edgeBandValue)) {
      alert("Please enter valid numeric values for Tools and Edge band.");
      return;
    }
    const calculatedValue = (toolsValue + edgeBandValue) / 2;
    const finalBatchNumber = calculatedValue;
    try {
      const newRecord = {
        tools: toolsValue,
        edgeBand: edgeBandValue,
        batchNumber: parseFloat(finalBatchNumber.toFixed(2)),
      };
      const batchRef = doc(db, "batchNumber", "rA2ORPJZleb2WWbHLMav");
      await updateDoc(batchRef, newRecord);
      dispatch(
        showToast({
          type: "success",
          msg: "Batch Number updated successfully",
        })
      );
      toggleModal();
      window.location.reload();
    } catch (error) {
      console.error("Error adding record to Firebase:", error);
      alert("Failed to add record.");
    }
  };

  const handleProfileSubmit = () => {
    const value = parseFloat(profileValue);

    if (isNaN(value)) {
      alert("Please enter a valid number.");
      return;
    }

    const updatedTableData = tableData.map((row, index) => {
      if (index > 0 && row[3] === "Profile") {
        const newHeight = (parseFloat(row[6]) || 0) - value;
        row[6] = newHeight.toFixed(1);
      }
      return row;
    });

    setTableData(updatedTableData);
    setIsProfileModalOpen(false);
    setProfileValue("");
  };

  const handleDateChange = (e) => {
    const inputDate = e.target.value;
    const [year, month, day] = inputDate.split("-");
    setDate(`${day}-${month}-${year}`);
  };


  const importAll = (r) => {
    let images = {};
    r.keys().forEach((item) => {
      images[item.replace("./", "")] = r(item);
    });
    return images;
  };

  const colorImages = importAll(
    require.context(
      "../../assets/images/color_code",
      false,
      /\.(png|jpe?g|svg)$/
    )
  );

  const colorOptions = useMemo(() => {
    const options = Object.keys(colorImages)
      .filter((key) => key.startsWith("AW_"))
      .map((key) => ({
        code: key.replace("AW_", "AW "),
        imageSrc: colorImages[key],
      }));
    options.push({ code: "Blank", imageSrc: null });
    return options;
  }, [colorImages]);

  const handleColorSelect = (code) => {
    setSelectedColor(code);

    if (code === "Blank") {
      setIsLuminateFieldVisible(true);
      setLuminate("");
    } else {
      setIsLuminateFieldVisible(false);
      setLuminate("");
    }
    setIsOpen(false);
  };
  const [totalPCS, setTotalPCS] = useState(0);

  const calculateTotalPCS = () => {
    const total = tableData
      .slice(1)
      .reduce((sum, row) => sum + (parseInt(row[2], 10) || 0), 0);
    setTotalPCS(total);
  };

  const removeColumn = () => {
    if (tableData[0].length <= 8) { // Keep at least the original 8 columns
      dispatch(
        showToast({
          type: "warning",
          msg: "Cannot remove more columns - minimum columns reached",
        })
      );
      return;
    }

    setTableData(prevData =>
      prevData.map(row => row.slice(0, -1)) // Remove last column from each row
    );

    dispatch(
      showToast({
        type: "success",
        msg: "Last column removed successfully",
      })
    );
  };

  const removeRow = () => {
    if (tableData.length <= 2) { // Keep at least header row + 1 data row
      dispatch(
        showToast({
          type: "warning",
          msg: "Cannot remove more rows - minimum rows reached",
        })
      );
      return;
    }

    setTableData(prevData => prevData.slice(0, -10));

    dispatch(
      showToast({
        type: "success",
        msg: "Last row removed successfully",
      })
    );
  };
  useEffect(() => {
    calculateTotalPCS();
  }, [tableData]);

  return (
    <React.Fragment>
      <div style={{ marginTop: "10%" }} className="page-content">
        <div
          style={{
            marginTop: "10%",
          }}
          className="align-page d-flex justify-content-between"
        >

          <div className="mb-3" style={{ width: "50%" }}>
            <Label for="dateInput">Date:</Label>
            <Input
              type="date"
              id="dateInput"
              value={date.split("-").reverse().join("-")}
              onChange={handleDateChange}
              className="mb-2"
            />
            <Label for="clientInput">Client Name:</Label>
            <Input
              type="text"
              id="clientInput"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mb-2"
            />
            <Label for="bookInput">Book:</Label>
            <Input
              type="text"
              id="bookInput"
              value={book}
              onChange={(e) => setBook(e.target.value)}
              className="mb-3"
            />
          </div>
          <div style={{ width: "50%" }}> <div className="ms-4 mb-2">
            <Label>Color Code:</Label>
            <div className="dropdown">
              <Input
                type="text"
                readOnly
                value={selectedColor.split(".")[0]}
                onClick={() => setIsOpen(!isOpen)}
                className="form-control dropdown-toggle cursor-pointer"
              />
              {isOpen && (
                <div
                  className="dropdown-menu show"
                  style={{
                    maxHeight: "40vh",
                    overflow: "auto",
                    display: "block",
                    position: "absolute",
                    inset: "0px auto auto 0px",
                    margin: "0px",
                    transform: "translate(0px, 38px)",
                  }}
                >
                  {colorOptions.map((option) => (
                    <button
                      key={option.code}
                      className="dropdown-item"
                      onClick={() => handleColorSelect(option.code)}
                    >
                      {option.imageSrc && (
                        <img
                          src={option.imageSrc}
                          alt={option.code}
                          style={{
                            width: "30px",
                            height: "30px",
                            marginRight: "10px",
                            objectFit: "cover",
                          }}
                        />
                      )}
                      {option.code.split(".")[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
            {selectedColor && (<div className="ms-4">
              {selectedColor !== "Blank" ? (<img src={colorImages[`${selectedColor.replace(" ", "_")}`]}
                alt={selectedColor}
                style={{
                  height: "138px",
                  objectFit: "contain",
                }} />) : null} </div>)}
            {isLuminateFieldVisible && (
              <div className="ms-4 mt-2">
                <Label>Luminate No:</Label>
                <Input
                  type="text"
                  className="form-control"
                  value={luminate}
                  onChange={(e) => setLuminate(e.target.value)}
                />
              </div>
            )}

          </div>
        </div>

        <Button className="mb-2 me-2" color="primary" onClick={addColumn}>
          Add Column
        </Button>
        <Button className="mb-2 me-2" color="danger" onClick={removeColumn}>
          Remove Column
        </Button>
        <Button className="mb-2 ml-2 me-2" color="primary" onClick={addRow}>
          Add Row
        </Button>
        <Button className="mb-2 me-2" color="danger" onClick={removeRow}>
          Remove Row
        </Button>
        {!isSpecial ? <Button className="mb-2 me-2" color="success" onClick={workPDF}>
          Work PDF
        </Button> : ""}

        <Button className="mb-2 me-2" color="success" onClick={normalPDF}>
          Normal PDF
        </Button>
        <Button className="mb-2 me-2" color="info" onClick={downloadExcel}>
          Download Excel
        </Button>
        <Button className="mb-2 me-2" color="warning" onClick={printPDF}>
          Print PDF
        </Button>
        <Button
          className="mb-2 me-2"
          color="primary"
          onClick={() => setIsProfileModalOpen(true)}
        >
          Profile
        </Button>

        <Button
          className="mb-2 me-2"
          color="primary"
          id="addBatchButton"
          onClick={toggleModal}
        >
          Update Batch
        </Button>
        <Button
          className="mb-2 me-2"
          color="success"
          onClick={importFile}
        >
          Import
        </Button>
        <div className="total-pcs mt-3">
          <h5>Total PCS: {totalPCS}</h5>
        </div>
        <Tooltip
          placement="top"
          isOpen={tooltipOpen}
          target="addBatchButton"
          toggle={toggleTooltip}
        >
          Batch Number: {batchNumber}
        </Tooltip>
        <HotTable
          data={JSON.parse(JSON.stringify(tableData))}
          colHeaders={true}
          rowHeaders={(index) => {
            return index === 0 ? "SR No" : `${index}`;
          }}
          height="auto"
          stretchH="all"
          licenseKey="non-commercial-and-evaluation"
          afterChange={handleTableChange}
          autoWrapRow={true}
          autoWrapCol={true}
          cells={(row, col, prop) => {
            const cellProperties = {};
            const rowData = tableData[row] || [];

            // Check if any cell in the row contains a special value
            const containsSpecialValue = rowData.some(
              (cellValue) => /aw/i.test(cellValue) && cellValue !== "Drawer"
            );

            // Apply highlight for rows with special values
            if (containsSpecialValue) {
              cellProperties.renderer = (
                instance,
                td,
                row,
                col,
                prop,
                value
              ) => {
                td.style.backgroundColor = "#ffeb3b"; // Highlight yellow
                td.style.fontWeight = "bold";
                td.textContent = value || "";
              };
            } else if (row === 0) {
              // Apply green background for the first row
              cellProperties.renderer = (
                instance,
                td,
                row,
                col,
                prop,
                value
              ) => {
                td.style.backgroundColor = "#059862"; // Green background
                td.style.fontWeight = "bold";
                td.textContent = value;
              };
            }

            // Additional logic for Remark (col 3) and Remark 2 (col 4)
            if ((col === 3 || col === 4) && row > 0) {
              cellProperties.renderer = (
                instance,
                td,
                row,
                col,
                prop,
                value
              ) => {
                td.innerHTML = ""; // Clear any existing content
                let text = "";
                let imageNumber = "";
                const hasPlus = value?.includes("+"); // Check if "+" exists

                const placeholderMap = {
                  c: "Cross",
                  f: "Fix",
                  p: "Profile",
                  j: "J Cross",
                  d: "D Cross",
                  u: "Upar Cross",
                  n: "Niche Cross",
                  g: "Glass",
                  fi: "Figure",
                  ar: "Drawer",
                };

                const match = value?.match(/^([a-z]+)?\.?(\d+)?\+?$/i); // Match key, number, and optional "+"

                // Handle matching and placeholder conversion
                if (match) {
                  const key = match[1]?.toLowerCase(); // Extract key
                  const number = match[2]; // Extract number

                  // Map placeholder text using key
                  if (key && placeholderMap[key]) {
                    text = placeholderMap[key];
                  }

                  // Check for a valid image number
                  if (number && ["1", "2", "3", "5"].includes(number)) {
                    imageNumber = number;
                  }
                }

                // Apply yellow background if "+" exists
                if (hasPlus || containsSpecialValue) {
                  td.style.backgroundColor = "#ffeb3b"; // Yellow background
                  td.style.fontWeight = "bold"; // Bold text
                }

                // If a valid image number is present, show the image
                if (imageNumber) {
                  const imgSrc = arrowMap[imageNumber]; // Use your map for image sources
                  if (imgSrc) {
                    const img = document.createElement("img");
                    img.src = imgSrc;
                    img.style.maxWidth = "20px";
                    img.style.maxHeight = "20px";
                    img.style.marginLeft = "8px";
                    td.appendChild(img); // Append the image to the cell
                  }
                  // Hide text when an image is displayed
                  text = "";
                }

                // If no image, show placeholder text (e.g., "Fix", "Glass")
                if (text) {
                  td.textContent = text;
                } else if (!imageNumber) {
                  // If no match, show raw value
                  td.textContent = value || "";
                }
              };
            }

            return cellProperties;
          }}
        />
      </div>

      <Modal isOpen={isModalOpen} toggle={toggleModal}>
        <ModalHeader toggle={toggleModal}>Add Batch Number</ModalHeader>
        <ModalBody>
          <div className="form-group">
            <Label for="field1">Tools:</Label>
            <Input
              type="number"
              id="field1"
              value={field1}
              onChange={(e) => setField1(e.target.value)}
            />
          </div>
          <div className="form-group mt-3">
            <Label for="field2">Edge Band:</Label>
            <Input
              type="number"
              id="field2"
              value={field2}
              onChange={(e) => setField2(e.target.value)}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleModal}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleFormSubmit}>
            Submit
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={isProfileModalOpen}
        toggle={() => setIsProfileModalOpen(false)}
      >
        <ModalHeader toggle={() => setIsProfileModalOpen(false)}>
          Update Profile
        </ModalHeader>
        <ModalBody>
          <Label for="profileValue">Enter Profile Value:</Label>
          <Input
            type="number"
            id="profileValue"
            value={profileValue}
            onChange={(e) => setProfileValue(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            color="secondary"
            onClick={() => setIsProfileModalOpen(false)}
          >
            Cancel
          </Button>
          <Button color="primary" onClick={handleProfileSubmit}>
            Submit
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default InchesToMM;
