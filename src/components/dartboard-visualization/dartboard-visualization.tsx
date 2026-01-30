import React from "react";
import { Box } from "@mui/material";

interface DartboardVisualizationProps {
  target: number | "Bull";
  size?: number;
}

const DartboardVisualization: React.FC<DartboardVisualizationProps> = ({
  target,
  size = 240,
}) => {
  const dartboardOrder = [
    20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
  ];

  // Helper function to round numbers to avoid floating-point precision issues
  const roundTo = (value: number, decimals: number = 2): number => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  const centerX = 170;
  const centerY = 170;

  // Radius values (matching reference implementation)
  const bullRadius = 10;
  const outerBullRadius = 20;
  const tripleInnerRadius = 80;
  const tripleOuterRadius = 95;
  const doubleInnerRadius = 130;
  const doubleOuterRadius = 145;
  const numberRadius = 160;

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number,
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: roundTo(centerX + radius * Math.cos(angleInRadians)),
      y: roundTo(centerY + radius * Math.sin(angleInRadians)),
    };
  };

  const createArc = (
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number,
  ) => {
    const start = polarToCartesian(centerX, centerY, outerRadius, endAngle);
    const end = polarToCartesian(centerX, centerY, outerRadius, startAngle);
    const innerStart = polarToCartesian(
      centerX,
      centerY,
      innerRadius,
      endAngle,
    );
    const innerEnd = polarToCartesian(
      centerX,
      centerY,
      innerRadius,
      startAngle,
    );
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";

    return `M ${roundTo(start.x)} ${roundTo(start.y)} A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${roundTo(end.x)} ${roundTo(end.y)} L ${roundTo(innerEnd.x)} ${roundTo(innerEnd.y)} A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${roundTo(innerStart.x)} ${roundTo(innerStart.y)} Z`;
  };

  const getTextPosition = (radius: number, angle: number) => {
    const pos = polarToCartesian(centerX, centerY, radius, angle);
    return {
      x: pos.x,
      y: pos.y,
    };
  };

  const segments = dartboardOrder.map((number, index) => {
    const segmentAngle = 360 / 20;
    const angle = segmentAngle * index - segmentAngle / 2;

    // Black segments: 20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5 (alternating)
    const isBlackSegment = index % 2 === 0;
    const singleColor = isBlackSegment ? "#1a1a1a" : "#3d3d3d"; // Dark grey/black and lighter grey
    const doubleTripleColor = isBlackSegment ? "#d32f2f" : "#2e7d32"; // Red and green

    return { number, angle, segmentAngle, singleColor, doubleTripleColor };
  });

  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox="0 0 340 340"
        style={{
          width: "100%",
          height: "100%",
          filter: "drop-shadow(0 0 8px rgba(0, 0, 0, 0.5))",
        }}
      >
        {/* Outer golden rim */}
        <circle
          cx={centerX}
          cy={centerY}
          r={145}
          fill="none"
          stroke="#ffc107"
          strokeWidth="4"
          opacity="0.9"
          style={{
            filter: "drop-shadow(0 0 4px rgba(255, 193, 7, 0.6))",
          }}
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={tripleOuterRadius}
          fill="none"
          stroke="#ffc107"
          strokeWidth="4"
          opacity="1"
          style={{
            filter: "drop-shadow(0 0 4px rgba(255, 193, 7, 0.6))",
          }}
        />

        {/* Segments */}
        {segments.map(
          ({ number, angle, segmentAngle, singleColor, doubleTripleColor }) => {
            const startAngle = angle;
            const endAngle = angle + segmentAngle;
            const midAngle = angle + segmentAngle / 2;
            const textPos = getTextPosition(numberRadius, midAngle);
            const isTarget = target !== "Bull" && number === target;

            return (
              <g key={number}>
                {/* Double ring */}
                <path
                  d={createArc(
                    doubleInnerRadius,
                    doubleOuterRadius,
                    startAngle,
                    endAngle,
                  )}
                  fill={doubleTripleColor}
                  stroke="#000"
                  strokeWidth="0.5"
                  opacity={isTarget ? 1 : 0.85}
                  style={isTarget ? { filter: "brightness(1.2)" } : {}}
                />

                {/* Outer single ring */}
                <path
                  d={createArc(
                    tripleOuterRadius,
                    doubleInnerRadius,
                    startAngle,
                    endAngle,
                  )}
                  fill={singleColor}
                  stroke="#000"
                  strokeWidth="0.5"
                  opacity={isTarget ? 0.9 : 0.85}
                />

                {/* Triple ring */}
                <path
                  d={createArc(
                    tripleInnerRadius,
                    tripleOuterRadius,
                    startAngle,
                    endAngle,
                  )}
                  fill={doubleTripleColor}
                  stroke="#000"
                  strokeWidth="0.5"
                  opacity={isTarget ? 1 : 0.85}
                  style={isTarget ? { filter: "brightness(1.2)" } : {}}
                />

                {/* Inner single ring */}
                <path
                  d={createArc(
                    outerBullRadius,
                    tripleInnerRadius,
                    startAngle,
                    endAngle,
                  )}
                  fill={singleColor}
                  stroke="#000"
                  strokeWidth="0.5"
                  opacity={isTarget ? 0.9 : 0.85}
                />

                {/* Gold wire dividers */}
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={
                    polarToCartesian(
                      centerX,
                      centerY,
                      doubleOuterRadius,
                      startAngle,
                    ).x
                  }
                  y2={
                    polarToCartesian(
                      centerX,
                      centerY,
                      doubleOuterRadius,
                      startAngle,
                    ).y
                  }
                  stroke="#ffc107"
                  strokeWidth="0.2"
                  opacity="0.7"
                />

                {/* Number labels outside dartboard */}
                <text
                  x={textPos.x}
                  y={textPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isTarget ? "#4caf50" : "#ffc107"}
                  fontWeight="bold"
                  fontSize={isTarget ? "16" : "14"}
                  style={{
                    filter: isTarget
                      ? "drop-shadow(0 0 4px rgba(76, 175, 80, 0.8))"
                      : "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))",
                  }}
                >
                  {number}
                </text>

                {/* Target highlight overlay */}
                {isTarget && (
                  <>
                    <path
                      d={createArc(
                        doubleInnerRadius,
                        doubleOuterRadius,
                        startAngle,
                        endAngle,
                      )}
                      fill="rgba(76, 175, 80, 0.3)"
                      stroke="#4caf50"
                      strokeWidth="2"
                    />
                    <path
                      d={createArc(
                        tripleInnerRadius,
                        tripleOuterRadius,
                        startAngle,
                        endAngle,
                      )}
                      fill="rgba(76, 175, 80, 0.3)"
                      stroke="#4caf50"
                      strokeWidth="2"
                    />
                    <path
                      d={createArc(
                        outerBullRadius,
                        tripleInnerRadius,
                        startAngle,
                        endAngle,
                      )}
                      fill="rgba(76, 175, 80, 0.2)"
                    />
                    <path
                      d={createArc(
                        tripleOuterRadius,
                        doubleInnerRadius,
                        startAngle,
                        endAngle,
                      )}
                      fill="rgba(76, 175, 80, 0.2)"
                    />
                  </>
                )}
              </g>
            );
          },
        )}

        {/* Outer Bull (25) - Green */}
        <circle
          cx={centerX}
          cy={centerY}
          r={outerBullRadius}
          fill={target === "Bull" ? "#4caf50" : "#2e7d32"}
          stroke="#000"
          strokeWidth="0.5"
          opacity={target === "Bull" ? 1 : 0.85}
          style={target === "Bull" ? { filter: "brightness(1.1)" } : {}}
        />

        {/* Bull (50) - Red */}
        <circle
          cx={centerX}
          cy={centerY}
          r={bullRadius}
          fill={target === "Bull" ? "#d32f2f" : "#c62828"}
          stroke="#000"
          strokeWidth="0.5"
          opacity={target === "Bull" ? 1 : 0.85}
          style={target === "Bull" ? { filter: "brightness(1.1)" } : {}}
        />

        {/* Bull target highlight */}
        {target === "Bull" && (
          <>
            <circle
              cx={centerX}
              cy={centerY}
              r={outerBullRadius}
              fill="none"
              stroke="#4caf50"
              strokeWidth="3"
              opacity="0.6"
            />
            <circle
              cx={centerX}
              cy={centerY}
              r={bullRadius}
              fill="none"
              stroke="#4caf50"
              strokeWidth="2"
              opacity="0.6"
            />
          </>
        )}
      </svg>
    </Box>
  );
};

export default DartboardVisualization;
