
import React, { useState } from "react";
import SearchField from "./DataTableSearch";
import DataTable, { createTheme } from "react-data-table-component";
import { toSnake } from "./ReqResConvertCase";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import { Button } from "reactstrap";
import TableSkeleton from "./Skeleton";

const CommonDataTable = (props) => {
  const { layoutModeType } = useSelector((state) => ({
    layoutModeType: state.Layout.layoutModeType,
  }));

  createTheme("dark", {
    background: {
      default: "transparent",
    },
  });

  const [filterParams, setFilterParams] = useState(props.filterParams);
  const updateFilterParams = async (newFilterParams) => {
    setFilterParams(newFilterParams);
    await props.fetchData(newFilterParams);
  };

  const exportToExcel = async () => {
    updateFilterParams({ ...filterParams, isDownload: true }); -.000000000000000000000000
    try {
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (filterParams.isDownload) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });

      const ws = XLSX.utils.json_to_sheet(props.exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      XLSX.writeFile(wb, `${props.exportFileName || "data"}.xlsx`, {
        bookType: "xlsx",
        type: "buffer",
        compression: true,
      });
      updateFilterParams({ ...filterParams, isDownload: false });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      updateFilterParams({ ...filterParams, isDownload: false });
    }
  };

  const handleRowsPerPageChange = (newPerPage, page) => {
    const updatedFilterParams = {
      ...filterParams,
      currentPage: page,
      perPage: newPerPage,
    };
    setFilterParams(updatedFilterParams);
    props.fetchData(updatedFilterParams);
  };

  const totalMyWallet = props.data.reduce((acc, entry) => acc + parseFloat(entry.myWallet || 0), 0).toFixed(2);
  const totalTrade = props.data.reduce((acc, entry) => acc + parseFloat(entry.trade || 0), 0).toFixed(2);
  const totalSum = (parseFloat(totalMyWallet) + parseFloat(totalTrade)).toFixed(2);
  const totalIncomeInUSD = (totalSum * 0.05).toFixed(2);
  const totalIncomeInINR = ((totalSum - parseFloat(totalIncomeInUSD)) * 85).toFixed(2);

  return (
    <div>
      <div className="button-margin">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="form-icon" style={{ flex: "1", maxWidth: "30%" }}>
            {props.searchEnable && (
              <div className="">
                <SearchField
                  filterParams={props.filterParams}
                  fetchData={props.fetchData}
                />
              </div>
            )}
          </div>
          <div>
            {props.showAddButton && (
              <Button
                className="add-button-margin"
                onClick={props.updateStates}
                color="primary"
              >
                <div>{props.form}</div>
                <i className="mdi mdi-plus"></i> Add User
              </Button>

            )}

            {props.showExportButton && (
              <Button
                className="btn btn-primary add-button-margin"
                color="primary"
                type="submit"
                onClick={exportToExcel}
              >
                <i className="bx bxs-file-export"></i>Export
              </Button>
            )}
            {props.showExportButton && (
              <Button
                className="btn btn-primary add-button-margin"
                color="primary"
                type="submit"
              >
                {`Total ${props.totalRows} ${props.moduleName}`}
              </Button>
            )}

          </div>
        </div>
      </div>
      <div className="table-container" style={{ marginBottom: "80px" }}>
        <div>
          <DataTable
            theme={layoutModeType === "light" ? "" : "dark"}
            columns={props.columns}
            data={props.data}
            // pagination
            highlightOnHover
            paginationServer
            selectableRows={props.checkboxEnabled ? props.checkboxEnabled : false}
            progressComponent={
              <div style={{ width: "100%" }}>
                <TableSkeleton rows={10} columns={props.columns.length} />
              </div>
            }
            progressPending={props.loading}
            onChangeRowsPerPage={handleRowsPerPageChange}
            sortServer
            persistTableHead
            paginationPerPage={props.perPage || process.env.REACT_APP_RECORDS_PER_PAGE}
            paginationTotalRows={props.totalRows}
            onSelectedRowsChange={({ selectedRows }) => {
              if (props.bulkSelected) {
                props.bulkSelected(selectedRows);
              }
            }}

            onSort={(sortingColumns, order) => {
              const orderBy = sortingColumns.selector
                .toString()
                .replace("row => row.", "");
              orderBy = orderBy.replace("(row) => row.", "");
              orderBy = orderBy.replace("row%20=>%20row.", "");
              const updatedFilterParams = {
                ...filterParams,
                order,
                orderBy: toSnake(orderBy),
              };
              setFilterParams(updatedFilterParams);
              props.fetchData(updatedFilterParams);
            }}
            onChangePage={(page) => {
              const updatedFilterParams = {
                ...filterParams,
                currentPage: page,
              };
              setFilterParams(updatedFilterParams);
              props.fetchData(updatedFilterParams);
            }}
          />
          {props.isShowTotal ?
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f1f1f1' }}>
              <div><strong>Total My Wallet: </strong>${totalMyWallet}</div>
              <div><strong>Total Trade: </strong>${totalTrade}</div>
              <div><strong>Total Charge ($): </strong>${totalIncomeInUSD}</div>
              <div><strong>Total Income ($) </strong>${totalSum}</div>
              <div><strong>Total Income (₹): </strong>₹{totalIncomeInINR}</div>
            </div> : ""
          }
        </div>

      </div>
    </div>
  );
};

export default CommonDataTable;
