import "./Grid.css";

const fontSize = 30;
const lineHeight = 1.25;

interface GridProps {
  content?: string;
}
export default function Grid({ content = "" }: GridProps) {
  const boxSize = fontSize * lineHeight;
  const lines = content.split("\n");
  const width = Math.max(...lines.map((line) => line.length));
  const height = lines.length;
  return (
    <textarea
      readOnly
      className="Grid"
      style={{
        fontSize: fontSize,
        padding: 1,
        width: width * boxSize + 2,
        height: height * boxSize + 2,
      }}
      value={content}
    />
  );
}
