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
    const ws = XLSX.utils.aoa_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table_data.xlsx");
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Table Data", 20, 10);

    doc.autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: 20,
      margin: { top: 20 },
      styles: { fontSize: 10 },
      theme: 'striped',
      pageBreak: 'auto',
    });
    const extraPages = 2;
    for (let i = 0; i < extraPages; i++) {
      doc.addPage();
      doc.text(`Extra Page ${i + 1}`, 20, 10);
    }
    doc.save("table_data_with_extra_pages.pdf");
  };

  const printPDF = () => {
    const doc = new jsPDF();
    doc.text("Table Data", 20, 10);
    doc.autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
    });
    window.open(doc.output("bloburl"));
  };

  const convertValue = (value, batchNumber) => {
    if (typeof value === "string") {
      const parts = value.split(".");
      if (parts.length > 2) {
        const wholeNumber = parseFloat(parts[0]) || 0;
        const fractionalNumber = parseFloat(parts.slice(1).join(".")) || 0;
        const fractionalCalc = fractionalNumber * 3.17;
        return (wholeNumber * 25.4 + fractionalCalc + batchNumber).toFixed(2);
      } else if (parts.length === 2) {
        const wholeNumber = parseFloat(parts[0]) || 0;
        const fractionalNumber = parseFloat(`0.${parts[1]}`) || 0;
        const wholeCalc = wholeNumber * 25.4;
        const fractionalCalc = fractionalNumber * 3.17;
        return (wholeCalc + fractionalCalc + batchNumber).toFixed(2);
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

            if (col === 1) {
              newData[row][5] = convertValue(newValue, batchNumber);
            } else if (col === 0) {
              newData[row][4] = convertValue(newValue, batchNumber);
            }
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
    } catch (error) {
      console.error("Error adding record to Firebase:", error);
      alert("Failed to add record.");
    }
  };

  return (
    <React.Fragment>
      <div style={{ marginTop: "8%" }} className="page-content">
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
          id="addBatchButton" // Set a unique ID for the button
          onClick={() => console.log("Button clicked")}
        >
          Update Batch
        </Button>

        <Tooltip
          placement="top" // You can change this to "right", "bottom", "left" as needed
          isOpen={tooltipOpen}
          target="addBatchButton" // Tooltip will be shown when hovering over this button
          toggle={toggleTooltip} // Toggle the tooltip visibility
        >
          Batch Number: {batchNumber}
        </Tooltip>
        {/* <Button className="mb-2 me-2" color="primary" onClick={toggleModal}>
          Add Batch
        </Button> */}
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
    </React.Fragment>
  );
};

export default BasicElements;