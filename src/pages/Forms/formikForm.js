import React, { useEffect, useState } from "react";
// import UiContent from "../../Components/Common/UiContent";
import { useNavigate } from "react-router-dom";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import { Button, Input, Label } from "reactstrap";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import * as XLSX from "xlsx"; // For Excel generation
import jsPDF from "jspdf"; // For PDF generation
import "jspdf-autotable"; // For table in PDF

const BasicElements = () => {
  const navigate = useNavigate();
  const [batchNumber, setBatchNumber] = useState(0);
  const [newBatchNumber, setNewBatchNumber] = useState("");
  const [tableData, setTableData] = useState([
    ["WEIGHT", "HEIGHT", "PCS", "REMARK", "WEIGHT(MM)", "HEIGHT(MM)", "PCS"],
    ...Array(100).fill(["", "", "", "", "", "", ""]),
  ]);

  // Fetch batch number and user data (same as before)
  useEffect(() => {
    const fetchBatchNumber = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "batchNumber"));
        const batchData = querySnapshot.docs[0]?.data();
        if (batchData && batchData.batchNumber) {
          setBatchNumber(parseFloat(batchData.batchNumber));
        }
      } catch (error) {
        console.error("Error fetching batch number:", error);
      }
    };
    fetchBatchNumber();
  }, []);

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

  const handleBatchNumberUpdate = async () => {
    try {
      const batchRef = doc(db, "batchNumber", "J2xTICcFKnV5FhDROSPi");
      await updateDoc(batchRef, {
        batchNumber: parseFloat(newBatchNumber),
      });
      setBatchNumber(parseFloat(newBatchNumber));
      alert("Batch number updated successfully!");
    } catch (error) {
      console.error("Error updating batch number:", error);
    }
  };

  // Add columns and rows (same as before)
  const addColumn = () => {
    const newTableData = tableData.map((row, index) => {
      if (index === 0) {
        return [...row, `Column ${row.length + 1}`];
      }
      return [...row, ""];
    });
    setTableData(newTableData);
  };

  const addRow = () => {
    const newRow = Array(tableData[0].length).fill("");
    setTableData((prevData) => [...prevData, newRow]);
  };

  // Download as Excel
  const downloadExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table_data.xlsx");
  };

  // Download as PDF with extra pages
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Table Data", 20, 10);

    // AutoTable settings for the main table
    doc.autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: 20,
      margin: { top: 20 },
      styles: { fontSize: 10 },
      theme: 'striped',
      pageBreak: 'auto', // Handles automatic page breaks
    });

    // Calculate the number of extra pages needed (for example, add 2 extra pages)
    const extraPages = 2;
    for (let i = 0; i < extraPages; i++) {
      doc.addPage();
      doc.text(`Extra Page ${i + 1}`, 20, 10); // Optional text or content for extra pages
    }

    // Save the PDF
    doc.save("table_data_with_extra_pages.pdf");
  };

  // Print the PDF
  const printPDF = () => {
    const doc = new jsPDF();
    doc.text("Table Data", 20, 10);
    doc.autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
    });
    window.open(doc.output("bloburl"));
  };

  const handleTableChange = (changes, source) => {
    if (changes && source !== "loadData") {
      setTableData((prevData) => {
        const newData = JSON.parse(JSON.stringify(prevData));
        changes.forEach(([row, col, oldValue, newValue]) => {
          if (newValue !== oldValue) {
            newData[row][col] = newValue;

            const convertValue = (value) => {
              if (!isNaN(value)) {
                const parts = value.toString().split(".");
                const wholePart = parseInt(parts[0], 10);
                let fractionalPart = 0;

                if (parts[1]) {
                  switch (parts[1]) {
                    case "1":
                      fractionalPart = 125;
                      break;
                    case "2":
                      fractionalPart = 250;
                      break;
                    case "3":
                      fractionalPart = 375;
                      break;
                    case "4":
                      fractionalPart = 500;
                      break;
                    case "5":
                      fractionalPart = 625;
                      break;
                    case "6":
                      fractionalPart = 750;
                      break;
                    case "7":
                      fractionalPart = 875;
                      break;
                    default:
                      fractionalPart = 0;
                  }
                }

                return wholePart + fractionalPart / 1000;
              }
              return value;
            };

            if (col === 1) {
              newData[row][5] = (
                convertValue(newValue) * 25.4 +
                batchNumber
              ).toFixed(2);
            } else if (col === 0) {
              newData[row][4] = (
                convertValue(newValue) * 25.4 +
                batchNumber
              ).toFixed(2);
            }
          }
        });
        return newData;
      });
    }
  };

  return (
    <React.Fragment>
      {/* <UiContent /> */}
      <div style={{ marginTop: "8%" }} className="page-content">
        <div>
          <Label for="batchNumberInput">Update Batch Number:</Label>
          <Input
            id="batchNumberInput"
            type="number"
            value={newBatchNumber}
            onChange={(e) => setNewBatchNumber(e.target.value)}
            placeholder="Enter new batch number"
            className="mb-2"
          />
          <Button className="mb-2" color="primary" onClick={handleBatchNumberUpdate}>
            Update Batch Number
          </Button>
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
        <HotTable
          data={JSON.parse(JSON.stringify(tableData))}
          colHeaders={true}
          rowHeaders={true}
          width="100%"
          height="800"
          licenseKey="non-commercial-and-evaluation"
          manualRowResize={true}
          manualColumnResize={true}
          contextMenu={[
            "row_above",
            "row_below",
            "col_left",
            "col_right",
            "remove_row",
            "remove_col",
          ]}
          afterChange={handleTableChange}
        />
      </div>
    </React.Fragment>
  );
};

export default BasicElements;
