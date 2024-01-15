import "./Grid.css";

interface GridProps {
  width?: number;
  height?: number;
  content?: string;
}
export default function Grid({
  width = 5,
  height = 5,
  content = "",
  ...props
}: GridProps) {
  const data = content.split("").map((char) => (char === "_" ? "" : char));

  return (
    <table {...props} className="Table">
      <tbody>
        {[...Array(height)].map((_, rowIndex) => (
          <tr key={rowIndex} className="Row">
            {[...Array(width)].map((_, colIndex) => {
              const char_index = rowIndex * width + colIndex;
              const char = data[char_index] || "";

              return (
                <td key={colIndex} className="Cell">
                  <span className="Span">{char}</span>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
