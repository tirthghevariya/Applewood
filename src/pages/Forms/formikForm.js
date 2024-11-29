import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import { Button, Input, Label, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from "reactstrap";
import { doc, updateDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../../firebase";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { showToast } from "../../slices/toast/reducer";
import { useDispatch } from "react-redux";

const BasicElements = () => {
  const navigate = useNavigate();
  const [batchNumber, setBatchNumber] = useState(0);
  const [tools, setTools] = useState(0);
  const [edge, setEdge] = useState(0);
  const dispatch = useDispatch();
  const [tooltipOpen, setTooltipOpen] = useState(false);

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

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Date: ${date}`, 10, 10);
    doc.text(`Client: ${clientName}`, 10, 20);
    doc.text(`Book: ${book}`, 10, 30);

    const filteredData = tableData
      .slice(1)
      .filter((row) => row.some((cell) => cell.trim() !== ""));
    const pcsIndex = tableData[0].indexOf("PCS");
    const totalPCS = filteredData.reduce((sum, row) => {
      const pcsValue = parseFloat(row[pcsIndex]) || 0;
      return sum + pcsValue;
    }, 0);

    const serialData = filteredData.map((row, index) => [index + 1, ...row]);
    const headers = ["S. No", ...tableData[0]];
    doc.autoTable({
      head: [headers],
      body: serialData,
      startY: 40,
      styles: { fontSize: 10 },
      theme: "grid",
      headStyles: { fillColor: [22, 160, 133] },
      margin: { top: 40 },
      didDrawCell: (data) => {
        if (!data || !data.row || !data.cell) return;

        const { table } = data;
        const rowHeight = data.cell.height;
        const rowY = data.row.y + rowHeight;

        if (data.row.index !== data.table.body.length - 1) {
          const startX = table.startX;
          const endX = table.startX + table.width;
          if (rowY && !isNaN(startX) && !isNaN(endX) && !isNaN(rowY)) {
            doc.setLineWidth(0.1);
            doc.line(startX, rowY, endX, rowY);
          }
        }
      },
    });
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Total PCS: ${totalPCS}`, 10, finalY);
    doc.save("table_data.pdf");
  };



  const printPDF = () => {
    const doc = new jsPDF();
    doc.text(`Date: ${date}`, 10, 10);
    doc.text(`Client: ${clientName}`, 10, 20);
    doc.text(`Book: ${book}`, 10, 30);
    doc.autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: 40,
    });
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
              if (newValue && newValue.startsWith("fi")) {
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
              } else if (newValue && newValue.startsWith("1")) {
                newData[row][col] = "⬅️";
              } else if (newValue && newValue.startsWith("2")) {
                newData[row][col] = "⬇️";
              } else if (newValue && newValue.startsWith("3")) {
                newData[row][col] = "➡️";
              } else if (newValue && newValue.startsWith("4")) {
                newData[row][col] = "⬅️";
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
      dispatch(showToast({
        type: "success",
        msg: "Batch Number updated successfully",
      }));
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


  return (
    <React.Fragment>


      <div style={{ marginTop: "10%" }} className="page-content">

        <div style={{ marginTop: "10%" }} className="page-content">
          <div className="mb-3">
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
          color="primary"
          onClick={() => setIsProfileModalOpen(true)}>
          Profile
        </Button>

        <Button
          className="mb-2 me-2"
          color="primary"
          id="addBatchButton"
          onClick={toggleModal}>
          Update Batch
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


      <Modal isOpen={isProfileModalOpen} toggle={() => setIsProfileModalOpen(false)}>
        <ModalHeader toggle={() => setIsProfileModalOpen(false)}>Update Profile</ModalHeader>
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
          <Button color="secondary" onClick={() => setIsProfileModalOpen(false)}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleProfileSubmit}>
            Submit
          </Button>
        </ModalFooter>
      </Modal>

    </React.Fragment >
  );
};

export default BasicElements;