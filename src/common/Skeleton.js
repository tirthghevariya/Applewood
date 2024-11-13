/* eslint-disable react/prop-types */
import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const TableSkeleton = ({ rows = 10, columns }) => {
  const renderInnerBoxes = () => {
    return Array.from({ length: columns }).map((_, index) => (
      <div style={{ width: "100%" }} key={index}>
        <Skeleton
          width={"80%"}
          height={8}
          style={{
            display: "flex",
            flexDirection: "row",
            backgroundColor: "#d1d1d1",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "20px",
            borderRadius: "0px",
          }}
        />
      </div>
    ));
  };

  return (
    <div>
      {/* <div
        style={{
          backgroundColor: "#a0a0a0",
          height: "40px",
          borderRadius: "0px",
        }}
      ></div> */}

      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            backgroundColor: rowIndex % 2 === 0 ? "#ffffff" : "#f0f0f0",
            display: "flex",
            alignItems: "center",
            width: "100%",
            paddingLeft: "20px",
            height: "36px",
          }}
        >
          <Skeleton
            width={"100%"}
            height={"20px"}
            style={{
              backgroundColor: rowIndex % 2 === 0 ? "#f0f0f0" : "#e0e0e0",
            }}
          />
          <div
            style={{
              display: "flex",
              width: "100%",
            }}
          >
            {renderInnerBoxes()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TableSkeleton;
