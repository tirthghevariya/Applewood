import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import {
  Button,
  Input,
  Label,
} from "reactstrap";
import { getDocs, collection } from "firebase/firestore";
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

const ClientMenu = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const arrowMap = {
    1: leftArrow,
    2: downArrow,
    3: rightArrow,
    5: upArrow,
  };

  const [tableData, setTableData] = useState([
    ["WEIGHT", "HEIGHT", "PCS", "REMARK"],
    ...Array(100).fill(["", "", "", ""]),
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
    const newRow = Array(tableData[0].length).fill("");
    setTableData((prevData) => [...prevData, newRow]);
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet(
      [...tableData,],
    );
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
        
          // Check if this cell needs an image
          const cellText = data.cell.text[0];
          const arrowImagePath = arrowImages[cellText]; // Get image for the text
        
          if (arrowImagePath && data.column.index === 4) { // Assuming "REMARK" is at index 4
            // Clear the cell background
            doc.setFillColor(255, 255, 255); // White background
            doc.rect(
              data.cell.x,
              data.cell.y,
              data.cell.width,
              data.cell.height,
              "F" // Fill style
            );
        
            // Calculate cell dimensions
            const cellWidth = data.cell.width;
            const cellHeight = data.cell.height;
        
            // Calculate image dimensions while keeping aspect ratio
            const imageMaxSize = Math.min(cellWidth, cellHeight) - 4; // 4px padding
            const imageWidth = imageMaxSize;
            const imageHeight = imageMaxSize;
        
            // Center the image within the cell
            const imageX = data.cell.x + (cellWidth - imageWidth) / 2;
            const imageY = data.cell.y + (cellHeight - imageHeight) / 2;
        
            // Add the image
            doc.addImage(
              arrowImagePath,
              "PNG",
              imageX,
              imageY,
              imageWidth,
              imageHeight
            );
          }
        },
        
        
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFont("helvetica", "bold");
      doc.text(`Total PCS: ${totalPCS}`, 10, finalY);
      window.open(doc.output("bloburl"));
    }
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
          const emptyRowsToAdd = Math.max(0, 100 - rows.length);
  
          const updatedData = [
            ...tableData.slice(0, 1), // Keep the original header row
            ...rows, // Add the rows from the Excel file
            ...Array(emptyRowsToAdd).fill(["", "", "", "", "", "", ""]), // Fill remaining rows with empty data
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
  

  const convertValue = (value) => {
    if (typeof value === "string") {
      const parts = value.split(".");
      if (parts.length === 2 && parts[1].length === 1) {
        const wholeNumber = parseFloat(parts[0]) || 0;
        const fractionalNumber = parseFloat(parts[1]) || 0;
        const wholeCalc = wholeNumber * 25.4;
        const fractionalCalc = fractionalNumber * 3.17;
        return (wholeCalc + fractionalCalc).toFixed(1);
      } else if (parts.length > 2) {
        const wholeNumber = parseFloat(parts[0]) || 0;
        const fractionalNumber = parseFloat(parts.slice(1).join(".")) || 0;
        const fractionalCalc = fractionalNumber * 3.17;
        return (wholeNumber * 25.4 + fractionalCalc).toFixed(1);
      } else if (parts.length === 2) {
        const wholeNumber = parseFloat(parts[0]) || 0;
        const fractionalNumber = parseFloat(`0.${parts[1]}`) || 0;
        const wholeCalc = wholeNumber * 25.4;
        const fractionalCalc = fractionalNumber * 3.17;
        return (wholeCalc + fractionalCalc).toFixed(1);
      }
    }

    if (!isNaN(value)) {
      return (value * 25.4).toFixed(2);
    }
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
              } else {
                convertValue(newValue);
              }
            }
            if (col === 1) {
              if (!newValue || newValue.trim() === "") {
              } else {
                convertValue(newValue);
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
              }
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
                            width: "20px",
                            height: "20px",
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
    </React.Fragment>
  );
};

export default ClientMenu;
