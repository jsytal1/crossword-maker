import { useRef, useState } from "react";

import "./GridInput.css";

type OnUpdateType = (value: string) => void;

interface GridProps {
  width?: number;
  height?: number;
  content?: string;
  onUpdate: OnUpdateType;
}
export default function Grid({
  width = 5,
  height = 5,
  content = "",
  onUpdate,
  ...props
}: GridProps) {
  const initialData = content
    .split("")
    .map((char) => (char === "_" ? "" : char));
  const [data, setData] = useState<string[]>(initialData);
  const inputRefs = useRef<HTMLInputElement[][]>(
    Array.from({ length: height }, () => Array(width).fill(null))
  );
  const handleInputChange = (row: number, col: number, value: string) => {
    const newData = [...data];
    const index = row * width + col;
    newData[index] = value.toUpperCase();
    setData(newData);
    onUpdate &&
      onUpdate(newData.map((char) => (char === "" ? "_" : char)).join(""));

    if (value.length === 0) {
      return;
    }
    if (row == height - 1 && col == width - 1) {
      inputRefs.current[0][0]?.focus();
      return;
    }
    if (col == width - 1) {
      inputRefs.current[row + 1][0]?.focus();
      return;
    }
    inputRefs.current[row][col + 1]?.focus();
  };

  const handleKeyDown = (
    row: number,
    col: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const index = row * width + col;
    if (e.key === "Backspace" && data[index].length === 0) {
      let nextRow = 0;
      let nextCol = 0;
      if (col === 0 && row === 0) {
        nextRow = height - 1;
        nextCol = width - 1;
      } else if (col === 0) {
        nextRow = row - 1;
        nextCol = width - 1;
      } else {
        nextRow = row;
        nextCol = col - 1;
      }
      e.preventDefault();
      handleInputChange(nextRow, nextCol, "");
      inputRefs.current[nextRow][nextCol]?.focus();
      return;
    }
  };

  return (
    <table {...props} className="Table">
      <tbody>
        {[...Array(height)].map((_, rowIndex) => (
          <tr key={rowIndex} className="Row">
            {[...Array(width)].map((_, colIndex) => {
              const char_index = rowIndex * width + colIndex;
              const char = data[char_index] || "_";
              const display_char = char === "_" ? "" : char;

              return (
                <td key={colIndex} className="Cell">
                  <input
                    onChange={(e) =>
                      handleInputChange(rowIndex, colIndex, e.target.value)
                    }
                    className="Input"
                    ref={(el) =>
                      el && (inputRefs.current[rowIndex][colIndex] = el)
                    }
                    type="text"
                    maxLength={1}
                    value={display_char}
                    onKeyDown={(e) => handleKeyDown(rowIndex, colIndex, e)}
                    autoFocus={rowIndex === 0 && colIndex === 0}
                  />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
