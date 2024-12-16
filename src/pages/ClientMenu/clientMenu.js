import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from 'handsontable/registry';
import "handsontable/dist/handsontable.full.min.css";
import {
  Button,
  Input,
  Label,
} from "reactstrap";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { showToast } from "../../slices/toast/reducer";
import { useDispatch } from "react-redux";

import leftArrow from "../../assets/images/left.png";
import upArrow from "../../assets/images/up.png";
import rightArrow from "../../assets/images/right.png";
import downArrow from "../../assets/images/down.png";

const ClientMenu = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  registerAllModules();
  const arrowMap = {
    1: leftArrow,
    2: downArrow,
    3: rightArrow,
    5: upArrow,
  };

  const [tableData, setTableData] = useState([
    ["WIDTH", "HEIGHT", "PCS", "REMARK", "REMARK 2"],
    ...Array(300).fill(["", "", "", ""]),
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
  const [isLuminateFieldVisible, setIsLuminateFieldVisible] = useState(false);
  const [luminate, setLuminate] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("Inches");

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData || !userData.username) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const superAdminUser = JSON.parse(localStorage.getItem("superAdminUser"));
    if (superAdminUser && superAdminUser?.userType === "main_admin") {
      navigate("/entries");
    }
  }, [navigate]);

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
    const sanitizedUnit = selectedUnit.toLowerCase();
    const sanitizedClientName = clientName?.toString().toLowerCase() || "client";
    const fileName = `${sanitizedClientName}_${date}_${sanitizedUnit}.xlsx`;

    const ws = XLSX.utils.aoa_to_sheet([...tableData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, fileName);
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

  const downloadPDF = async () => {
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
          "PCS",
        ],
      ];

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    let currentY = 10; // Start Y position for the content
    const lineSpacing = 10; // Space between each line of text

    // Add text fields with proper spacing
    doc.text(`Date: ${date}`, 10, currentY);
    currentY += lineSpacing;

    doc.text(`Client: ${clientName}`, 10, currentY);
    currentY += lineSpacing;

    doc.text(`Book: ${book}`, 10, currentY);
    currentY += lineSpacing;

    doc.text(`Unit: ${selectedUnit}`, 10, currentY);
    currentY += lineSpacing;

    if (luminate) {
      doc.text(`Luminate No: ${luminate}`, 10, currentY);
      currentY += lineSpacing;
    }

    // Handle color image (optional)
    const selectedColorImage =
      colorImages[selectedColor.replace(" ", "_")] || null;
    let colorImageBase64 = null;

    if (selectedColorImage) {
      colorImageBase64 = await fetchImageAsBase64(selectedColorImage);
    }

    if (colorImageBase64) {
      const imageWidth = 40;
      const imageHeight = 50;
      const imageXPosition = 155;
      const imageYPosition = 5;

      doc.addImage(
        colorImageBase64,
        "PNG",
        imageXPosition,
        imageYPosition,
        imageWidth,
        imageHeight
      );
      currentY += imageHeight - 40;
    }
    const tableStartY = currentY;

    const filteredData = safeTableData
      .slice(1)
      .filter((row) => row.some((cell) => cell && cell.trim() !== ""));

    const pcsIndex = safeTableData[0].indexOf("PCS");

    const totalPCS = filteredData.reduce((sum, row) => {
      const pcsValue = parseFloat(row[pcsIndex]) || 0;
      return sum + pcsValue;
    }, 0);

    const arrowImages = {
      1: await fetchImageAsBase64(leftArrow),
      2: await fetchImageAsBase64(downArrow),
      3: await fetchImageAsBase64(rightArrow),
      5: await fetchImageAsBase64(upArrow),
    };

    // Process table data
    const processedData = filteredData.map((row) => {
      return row.map((cell) => {
        if (["1", "2", "3", "5"].includes(cell)) {
          return cell;
        }
        return cell;
      });
    });

    const serialData = processedData.map((row, index) => [index + 1, ...row]);
    const headers = ["S. No", ...safeTableData[0]];

    // Render table with padding
    doc.autoTable({
      head: [headers],
      body: serialData,
      startY: tableStartY,
      styles: { fontSize: 10 },
      theme: "grid",
      headStyles: { fillColor: [22, 160, 133] },
      margin: { top: 10 },
      didDrawCell: (data) => {
        if (!data || !data.row || !data.cell) return;

        const cellText = data.cell.text[0];
        const arrowImagePath = arrowImages[cellText];

        // Add image to "Remark" column (index 4) or "Remark 2" column (index 5)
        if (arrowImagePath && (data.column.index === 4 || data.column.index === 5)) {
          doc.setFillColor(255, 255, 255); // White background for cell
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            "F"
          );

          const cellWidth = data.cell.width;
          const cellHeight = data.cell.height;
          const maxImageSize = Math.min(cellWidth, cellHeight) - 4;
          const imageWidth = maxImageSize;
          const imageHeight = maxImageSize;

          doc.addImage(
            arrowImagePath,
            "PNG",
            data.cell.x + (cellWidth - imageWidth) / 2,
            data.cell.y + (cellHeight - imageHeight) / 2,
            imageWidth,
            imageHeight
          );
        }
      },
    });

    // Add Total PCS text below the table
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Total PCS: ${totalPCS}`, 10, finalY);

    // Sanitize client name and unit for file name
    const sanitizedClientName = clientName.toString().toLowerCase();
    const sanitizedUnit = selectedUnit.toLowerCase();

    // Save the PDF
    doc.save(`${sanitizedClientName}_${date}_${sanitizedUnit}.pdf`);
  };

  const printPDF = async () => {
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
          "WIDTH(MM)",
          "HEIGHT(MM)",
          "PCS",
        ],
      ];

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    let currentY = 10;
    const lineSpacing = 10;

    doc.text(`Date: ${date}`, 10, currentY);
    currentY += lineSpacing;

    doc.text(`Client: ${clientName}`, 10, currentY);
    currentY += lineSpacing;

    doc.text(`Book: ${book}`, 10, currentY);
    currentY += lineSpacing;

    if (luminate) {
      doc.text(`Luminate No: ${luminate}`, 10, currentY);
      currentY += lineSpacing;
    }

    // Handle color image (optional)
    const selectedColorImage = colorImages[selectedColor.replace(" ", "_")] || null;
    let colorImageBase64 = null;

    if (selectedColorImage) {
      colorImageBase64 = await fetchImageAsBase64(selectedColorImage);
    }

    if (colorImageBase64) {
      const imageWidth = 40;
      const imageHeight = 50;
      const imageXPosition = 155;
      const imageYPosition = 5;

      doc.addImage(
        colorImageBase64,
        "PNG",
        imageXPosition,
        imageYPosition,
        imageWidth,
        imageHeight
      );
      currentY += imageHeight - 30;
    }

    const tableStartY = currentY;

    const filteredData = safeTableData
      .slice(1)
      .filter((row) => row.some((cell) => cell && cell.trim() !== ""));

    const pcsIndex = safeTableData[0].indexOf("PCS");

    const totalPCS = filteredData.reduce((sum, row) => {
      const pcsValue = parseFloat(row[pcsIndex]) || 0;
      return sum + pcsValue;
    }, 0);

    // Fetch arrow images as Base64
    const arrowImages = {
      1: await fetchImageAsBase64(leftArrow),
      2: await fetchImageAsBase64(downArrow),
      3: await fetchImageAsBase64(rightArrow),
      5: await fetchImageAsBase64(upArrow),
    };

    // Process table data
    const processedData = filteredData.map((row) => {
      return row.map((cell) => {
        if (["1", "2", "3", "5"].includes(cell)) {
          return cell;
        }
        return cell;
      });
    });

    const serialData = processedData.map((row, index) => [index + 1, ...row]);
    const headers = ["S. No", ...safeTableData[0]];

    // Render table with padding
    doc.autoTable({
      head: [headers],
      body: serialData,
      startY: tableStartY,
      styles: { fontSize: 10 },
      theme: "grid",
      headStyles: { fillColor: [22, 160, 133] },
      margin: { top: 10 },
      didDrawCell: (data) => {
        if (!data || !data.row || !data.cell) return;

        const cellText = data.cell.text[0];
        const arrowImagePath = arrowImages[cellText];

        if (arrowImagePath && data.column.index === 4) { // Assuming "REMARK" is at index 4
          doc.setFillColor(255, 255, 255); // White background for cell
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            "F"
          );

          const cellWidth = data.cell.width;
          const cellHeight = data.cell.height;
          const maxImageSize = Math.min(cellWidth, cellHeight) - 4;
          const imageWidth = maxImageSize;
          const imageHeight = maxImageSize;

          doc.addImage(
            arrowImagePath,
            "PNG",
            data.cell.x + (cellWidth - imageWidth) / 2,
            data.cell.y + (cellHeight - imageHeight) / 2,
            imageWidth,
            imageHeight
          );
        }
      },
    });

    // Add Total PCS text below the table
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Total PCS: ${totalPCS}`, 10, finalY);

    // Open PDF in a new tab
    window.open(doc.output("bloburl"));
  };


  const importFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx, .xls";
    input.style.display = "none"; // Hidden input

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

          // Ensure that we do not pass a negative value to Array
          const emptyRowsToAdd = Math.max(0, 300 - rows.length);

          const updatedData = [
            ...tableData.slice(0, 1), // Keep the original header row
            ...rows, // Add the rows from the Excel file
            ...Array(emptyRowsToAdd).fill(["", "", "", "", "", "", ""]), // Fill remaining rows with empty data
          ];

          setTableData(updatedData);

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

    // Trigger file input click
    input.click();
  };

  const handleTableChange = (changes, source) => {
    if (changes && source !== "loadData") {
      setTableData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData));

        changes.forEach(([row, col, oldValue, newValue]) => {
          if (newValue !== oldValue) {
            const isSpecialValue = /aw/i.test(newValue) || newValue === "+";

            // Handle Remark and Remark 2 logic
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
          }
        });

        return newData;
      });
    }
  };

  const handleDateChange = (e) => {
    const inputDate = e.target.value;
    const [year, month, day] = inputDate.split("-");
    setDate(`${day}-${month}-${year}`);
  };

  const [selectedColor, setSelectedColor] = useState("AW_301");
  const [isOpen, setIsOpen] = useState(false);

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

  useEffect(() => {
    calculateTotalPCS();
  }, [tableData]);

  return (
    <React.Fragment>
      <div className="page-content">
        <div
          style={{
            marginTop: "7%",
          }}
          className="align-page align-page d-flex justify-content-between"
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
            <div className="mb-3">
              <label htmlFor="unitSelect" className="form-label">Select Unit</label>
              <select
                id="unitSelect"
                className="form-select"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                <option value="Inches">Inches</option>
                <option value="MM">MM</option>
              </select>
            </div>

          </div>
          <div style={{ width: "50%" }}> <div className="ms-4 mb-2">
            <Label>Color Code:</Label>
            <div className="dropdown">
              <Input type="text"
                readOnly value={selectedColor.split(".")[0]}
                onClick={() => setIsOpen(!isOpen)}
                className="form-control dropdown-toggle cursor-pointer" />
              {isOpen && (
                <div className="dropdown-menu show"
                  style={{
                    maxHeight: "40vh",
                    overflow: "auto",
                    display: "block",
                    position: "absolute",
                    inset: "0px auto auto 0px",
                    margin: "0px",
                    transform: "translate(0px, 38px)",
                  }} >
                  {colorOptions.map((option) => (<button key={option.code}
                    className="dropdown-item"
                    onClick={() => handleColorSelect(option.code)} >
                    {option.imageSrc && (<img src={option.imageSrc}
                      alt={option.code}
                      style={{
                        width: "30px",
                        height: "30px",
                        marginRight: "10px",
                        objectFit: "cover",
                      }} />)}
                    {option.code.split(".")[0]}
                  </button>))} </div>)}
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
        <Button className="mb-2 ml-2 me-2" color="primary" onClick={addRow}>
          Add Row
        </Button>
        <Button className="mb-2 me-2" color="success" onClick={downloadExcel}>
          Download Excel
        </Button>
        <Button className="mb-2 me-2" color="info" onClick={downloadPDF}>
          Download PDF
        </Button>
        <Button className="mb-2 me-2" color="warning" onClick={printPDF}>
          Print PDF
        </Button>
        <Button
          className="mb-2 me-2"
          color="success"
          id="addBatchButton"
          onClick={importFile}
        >
          Import
        </Button>
        <div className="total-pcs mt-3">
          <h5>Total PCS: {totalPCS}</h5>
        </div>
        <HotTable
          data={JSON.parse(JSON.stringify(tableData))}
          colHeaders={true}
          rowHeaders={(index) => {
            return index === 0 ? "SR No" : `${index}`;
          }}
          autoWrapRow={true}
          autoWrapCol={true}
          height="auto"
          stretchH="all"
          licenseKey="non-commercial-and-evaluation"
          afterChange={handleTableChange}
          cells={(row, col) => {
            const cellProperties = {};
            const rowData = tableData[row] || [];

            const containsSpecialValue = rowData.some(
              (cellValue) => /aw/i.test(cellValue) && cellValue !== "Drawer"
            );

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
    </React.Fragment>
  );
};

export default ClientMenu;
