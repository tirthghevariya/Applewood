import React, { useEffect, useState, useMemo } from "react";
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

const InchesToMM = () => {
  const navigate = useNavigate();
  const [batchNumber, setBatchNumber] = useState(0);
  const [tools, setTools] = useState(0);
  const [edge, setEdge] = useState(0);
  const dispatch = useDispatch();
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const arrowMap = {
    1: leftArrow,
    2: downArrow,
    3: rightArrow,
    5: upArrow,
  };

  const [tableData, setTableData] = useState([
    ["WEIGHT", "HEIGHT", "PCS", "REMARK", "WEIGHT(MM)", "HEIGHT(MM)", "PCS"],
    ...Array(100).fill(["", "", "", "", "", "", ""]),
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
    fetchBatchNumber();
  }, []);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileValue, setProfileValue] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [field1, setField1] = useState(tools.toString());
  const [field2, setField2] = useState(edge.toString());

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

  useEffect(() => {
    setField1(tools.toString());
    setField2(edge.toString());
  }, [tools, edge]);

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
    const newRow = Array(tableData[0].length).fill("");
    setTableData((prevData) => [...prevData, newRow]);
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      [`Date: ${date}`, `Client: ${clientName}`, `Book: ${book}`],
      [],
      ...tableData,
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table_data.xlsx");
  };

  const workPDF = () => {
    const remarkOrder = [
      "fix", 
      "blank", 
      "Profile", 
      "1", 
      "2", 
      "3", 
      "5", 
      "Glass", 
      "Figure", 
      "Cross", 
      "J Cross", 
      "D Cross", 
      "Upar Cross", 
      "Niche Cross"
    ];
  
    // Sort data based on remark priority
    const sortedData = tableData.slice(1).sort((a, b) => {
      const remarkA = a[3] || ""; // Assuming the "REMARK" column is index 3
      const remarkB = b[3] || "";
  
      const orderA = remarkOrder.indexOf(remarkA.toLowerCase());
      const orderB = remarkOrder.indexOf(remarkB.toLowerCase());
  
      return orderA - orderB;
    });
  
    // Rebuild table data with headers
    const sortedTableData = [
      tableData[0], // Keep header row as it is
      ...sortedData, // Add the sorted data
    ];
  
    // Create Excel sheet from the sorted data
    const ws = XLSX.utils.aoa_to_sheet([
      [`Date: ${date}`, `Client: ${clientName}`, `Book: ${book}`],
      [],
      ...sortedTableData,
    ]);
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  
    // Trigger the file download
    XLSX.writeFile(wb, "sorted_table_data.xlsx");
  };
  
  
  
  

 const normalPDF = () => {
  // Rearrange tableData columns to move "REMARK" to the last position
  const rearrangedTableData = tableData.map((row) => {
    const [weight, height, pcs, remark, weightMM, heightMM, pcsFinal] = row;
    return [weight, height, pcs, weightMM, heightMM, pcsFinal, remark];
  });

  const ws = XLSX.utils.aoa_to_sheet([
    [`Date: ${date}`, `Client: ${clientName}`, `Book: ${book}`],
    [],
    ...rearrangedTableData,
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, "table_data.xlsx");
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
    } else {
      const safeTableData = Array.isArray(tableData)
        ? tableData
        : [
          [
            "WEIGHT",
            "HEIGHT",
            "PCS",
            "REMARK",
            "WEIGHT(MM)",
            "HEIGHT(MM)",
            "PCS",
          ],
        ];

      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);

      doc.text(`Date: ${date}`, 10, 10);
      doc.text(`Client: ${clientName}`, 10, 20);
      doc.text(`Book: ${book}`, 10, 30);

      const selectedColorImage =
        colorImages[selectedColor.replace(" ", "_")] || null;
      let colorImageBase64 = null;
      if (selectedColorImage) {
        colorImageBase64 = await fetchImageAsBase64(selectedColorImage);
      }

      let imageYPosition = 0;

      if (colorImageBase64) {
        const imageWidth = 50;
        const imageHeight = 70;
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

      let tableStartY = 40;
      if (colorImageBase64) {
        tableStartY = imageYPosition + 80;
      }

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

      doc.autoTable({
        head: [headers],
        body: serialData,
        startY: tableStartY,
        styles: { fontSize: 10 },
        theme: "grid",
        headStyles: { fillColor: [22, 160, 133] },
        margin: { top: tableStartY },
        didDrawCell: (data) => {
          if (!data || !data.row || !data.cell) return;

          const cellText = data.cell.text[0];
          const arrowImagePath = arrowImages[cellText];

          if (arrowImagePath && data.column.index === 4) {
            doc.setFillColor(255, 255, 255);
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

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFont("helvetica", "bold");
      doc.text(`Total PCS: ${totalPCS}`, 10, finalY);

      const sanitizedClientName = clientName.toString().toLowerCase();
      doc.save(`${sanitizedClientName}_${date}.pdf`);
    }
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
            "WEIGHT",
            "HEIGHT",
            "PCS",
            "REMARK",
            "WEIGHT(MM)",
            "HEIGHT(MM)",
            "PCS",
          ],
        ];
  
    // Reorder headers to move REMARK to the last column
    const headers = [...safeTableData[0]];
    const remarkIndex = headers.indexOf("REMARK");
    if (remarkIndex > -1) {
      headers.splice(remarkIndex, 1); // Remove REMARK
      headers.push("REMARK"); // Add REMARK at the end
    }
  
    // Reorder each row to match the new header order
    const reorderedData = safeTableData.slice(1).map((row) => {
      const newRow = [...row];
      if (remarkIndex > -1) {
        const remarkValue = newRow[remarkIndex];
        newRow.splice(remarkIndex, 1); // Remove REMARK
        newRow.push(remarkValue); // Add REMARK at the end
      }
      return newRow;
    });
  
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
  
    doc.text(`Date: ${date}`, 10, 10);
    doc.text(`Client: ${clientName}`, 10, 20);
    doc.text(`Book: ${book}`, 10, 30);
  
    const selectedColorImage =
      colorImages[selectedColor.replace(" ", "_")] || null;
    let colorImageBase64 = null;
    if (selectedColorImage) {
      colorImageBase64 = await fetchImageAsBase64(selectedColorImage);
    }
  
    let imageYPosition = 0;
  
    if (colorImageBase64) {
      const imageWidth = 50;
      const imageHeight = 70;
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
  
    let tableStartY = 40;
    if (colorImageBase64) {
      tableStartY = imageYPosition + 80;
    }
  
    const serialData = reorderedData.map((row, index) => [index + 1, ...row]);
    const finalHeaders = ["S. No", ...headers];
  
    doc.autoTable({
      head: [finalHeaders],
      body: serialData,
      startY: tableStartY,
      styles: { fontSize: 10 },
      theme: "grid",
      headStyles: { fillColor: [22, 160, 133] },
      margin: { top: tableStartY },
    });
  
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Total PCS: ${serialData.reduce((sum, row) => sum + (parseFloat(row[3]) || 0), 0)}`, 10, finalY);
  
    window.open(doc.output("bloburl"));
  };
  

  const convertValue = (value, batchNumber) => {
    if (typeof value === "string") {
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
          const updatedData = [
            ...tableData.slice(0, 1), // Keep the original header row
            ...rows, // Add the rows from the Excel file
            ...Array(100 - rows.length).fill(["", "", "", "", "", "", ""]), // Fill remaining rows with empty data
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
  
    // Trigger file input click
    input.click();
  };
  

  const handleTableChange = (changes, source) => {
    if (changes && source !== "loadData") {
      setTableData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData));
        changes.forEach(([row, col, oldValue, newValue]) => {
          if (newValue !== oldValue) {
            newData[row][col] = newValue;
            if (col === 0) {
              if (!newValue || newValue.trim() === "") {
                newData[row][4] = "";
              } else {
                newData[row][4] = convertValue(newValue, batchNumber);
              }
            }
            if (col === 1) {
              if (!newValue || newValue.trim() === "") {
                newData[row][5] = "";
              } else {
                newData[row][5] = convertValue(newValue, batchNumber);
              }
            }
            if (col === 3) {
              if (newValue && ["1", "2", "3", "5"].includes(newValue)) {
                newData[row][col] = newValue;
              } else if (newValue && newValue.startsWith("fi")) {
                newData[row][col] = "Figure";
              } else if (newValue && newValue.startsWith("f")) {
                newData[row][col] = "Fix";
              } else if (newValue && newValue.startsWith("g")) {
                newData[row][col] = "Glass";
              } else if (newValue && newValue.startsWith("p")) {
                newData[row][col] = "Profile";
              } else if (newValue && newValue.startsWith("j")) {
                newData[row][col] = "J Cross";
              } else if (newValue && newValue.startsWith("d")) {
                newData[row][col] = "D Cross";
              } else if (newValue && newValue.startsWith("c")) {
                newData[row][col] = "Cross";
              } else if (newValue && newValue.startsWith("u")) {
                newData[row][col] = "Upar Cross";
              } else if (newValue && newValue.startsWith("n")) {
                newData[row][col] = "Niche Cross";
              } else if (newValue && newValue.startsWith("g.1")) {
                newData[row][col] = "Niche Cross".includes();
              }
            }
            newData[row][6] = newData[row][2];
          }
        });
        return newData;
      });
    }
  };
  const toggleTooltip = () => setTooltipOpen(!tooltipOpen);

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
        const newHeight = (parseFloat(row[5]) || 0) - value;
        row[5] = newHeight.toFixed(1);
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
    return Object.keys(colorImages)
      .filter((key) => key.startsWith("AW_"))
      .map((key) => ({
        code: key.replace("AW_", "AW "),
        imageSrc: colorImages[key],
      }));
  }, [colorImages]);

  useEffect(() => {
    const storedColor = localStorage.getItem("selectedColor");
    if (storedColor) {
      setSelectedColor(storedColor);
    }
  }, []);
  const handleColorSelect = (code) => {
    setSelectedColor(code);
    setIsOpen(false);
    localStorage.setItem("selectedColor", code);
  };

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
          <div style={{ width: "50%" }}>
            <div className="ms-4 mb-2">
              <Label>Color Code:</Label>
              <div className="dropdown ">
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
                        {option.code.split(".")[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {selectedColor && (
              <div className="ms-4">
                <img
                  src={colorImages[`${selectedColor.replace(" ", "_")}`]}
                  alt={selectedColor}
                  style={{
                    height: "138px",
                    objectFit: "contain",
                  }}
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
        {/* <Button className="mb-2 me-2" color="success" onClick={downloadExcel}>
          Download Excel
        </Button> */}
        <Button className="mb-2 me-2" color="success" onClick={workPDF}>
         Work PDF
        </Button>
        <Button className="mb-2 me-2" color="success" onClick={normalPDF}>
         Normal PDF
        </Button>
        <Button className="mb-2 me-2" color="info" onClick={downloadPDF}>
          Download PDF
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
          id="addBatchButton"
          onClick={importFile}
        >
          Import
        </Button>

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
          rowHeaders={true}
          width="100%"
          height="800"
          stretchH="all"
          licenseKey="non-commercial-and-evaluation"
          afterChange={handleTableChange}
          cells={(row, col, prop) => {
            const cellProperties = {};
            if (col === 3) {
              const value = tableData[row] ? tableData[row][col] : "";
              if (["1", "2", "3", "5"].includes(value)) {
                cellProperties.renderer = (
                  instance,
                  td,
                  row,
                  col,
                  prop,
                  value,
                  cellProperties
                ) => {
                  td.innerHTML = "";
                  const img = document.createElement("img");
                  img.src = arrowMap[value];
                  img.style.maxWidth = "20px";
                  img.style.maxHeight = "20px";
                  td.appendChild(img);
                };
              }
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
