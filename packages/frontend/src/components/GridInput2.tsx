import { useEffect, useRef, useState } from "react";

import "./GridInput2.css";

const fontSize = 30;
const lineHeight = 1.25;
const boxSize = fontSize * lineHeight;
const textAreaPadding = 1;
const textAreaBorder = 1;

type OnUpdateType = (value: string) => void;

interface LinePosition {
  line: number;
  pos: number;
}

interface GridProps {
  minHeight?: number;
  maxHeight?: number;
  minWidth?: number;
  maxWidth?: number;
  onUpdate: OnUpdateType;
}

export default function GridInput2({
  minHeight = 2,
  maxHeight = 50,
  maxWidth = 50,
  onUpdate,
}: GridProps) {
  const [text, setText] = useState(Array(5).fill(" ".repeat(5)).join("\n"));
  //const [overtypeToggle, setOvertypeToggle] = useState(false);
  const [linePosition, setLinePosition] = useState<null | LinePosition>({
    line: 0,
    pos: 0,
  });
  const [selection, setSelection] = useState({
    start: 0,
    end: 0,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  /*
  const getTextPosition = (line: number, pos: number, text: string) => {
    const lines = text.split("\n");
    return pos + lines.slice(0, line).join("\n").length;
  };
  */

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    const lines = value.split("\n");

    if (lines[lines.length - 1].length === 0) {
      lines.pop();
    }
    const lineLengths = lines.map((line) => line.length);
    if (lines.length > maxHeight || Math.max(...lineLengths) > maxWidth) {
      setTimeout(() => {
        event.target.selectionStart = selection.start;
        event.target.selectionEnd = selection.end;
      }, 0);

      return;
    }
    if (value.includes("ß")) {
      setTimeout(() => {
        event.target.selectionStart = selection.start;
        event.target.selectionEnd = selection.end;
      }, 0);

      const newValue = value.replace(/ß/g, "ẞ");
      onUpdate(newValue);
      setText(newValue);
      return;
    }
    onUpdate(event.target.value);
    setText(event.target.value);
  };

  /*
  const handleBlur = () => {
    const value = text;
    const { pos, line } = getLinePosition(selection.start, value);
    const lines = value.split("\n");
    if (lines[lines.length - 1].length === 0) {
      lines.pop();
    }
    if (lines.length < minHeight) {
      lines.push(...Array(minHeight - lines.length).fill(" ".repeat(minWidth)));
    }
    const trimmedLines = lines.map((line) => line.replace(/#+$/, ""));
    const targetWidth = Math.max(
      minWidth,
      ...trimmedLines.map((line) => line.length)
    );
    const rightPaddedValue = trimmedLines
      .map((line, idx) =>
        idx === trimmedLines.length - 1 && line == ""
          ? line
          : line.padEnd(targetWidth, "#")
      )
      .join("\n");
    setText(rightPaddedValue);
    setLinePosition({ line, pos });
  };
  */

  /*
  const handleFocus = () => {
    const { pos, line } = linePosition;
    const textPosition = getTextPosition(line, pos, text);
    if (textareaRef.current) {
      textareaRef.current.selectionStart = textPosition;
      textareaRef.current.selectionEnd = textPosition;
    }
  };
  */

  /*
  const handleKeyUp = () => {
    if (overtypeToggle && textareaRef?.current) {
      textareaRef.current.selectionEnd = textareaRef.current.selectionStart;
      setOvertypeToggle(false);
    }
  };
  */

  /*
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Backspace") {
      setTimeout(() => {
        if (textareaRef.current) {
          setSelection({
            start: selection.start - 1,
            end: selection.end - 1,
          });
          textareaRef.current.selectionStart = selection.start - 1;
          textareaRef.current.selectionEnd = selection.end - 1;
        }
      }, 0);
    }
  };
  */

  /*
  const _handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (!textareaRef?.current) {
      return;
    }
    if (overtypeToggle) {
      return;
    }
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const content = textareaRef.current.value || "\n";
    if (start !== end) {
      return;
    }
    const nextChar = content[end] || "\n";
    if (nextChar === "\n") {
      return;
    }

    if (
      event.key === "#" ||
      event.key === " " ||
      /^\p{L}$/u.test(event.key) ||
      event.key === "Backspace"
    ) {
      if (event.key === "Backspace") {
        setTimeout(() => {
          if (textareaRef.current) {
            setSelection({
              start: selection.start - 1,
              end: selection.end - 1,
            });
            textareaRef.current.selectionStart = selection.start - 1;
            textareaRef.current.selectionEnd = selection.end - 1;
          }
        }, 0);
      }
      textareaRef.current.selectionEnd = start + 1;
      setOvertypeToggle(true);
    }
  };
  */

  const handleSelectionChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setLinePosition(null);
    setSelection({
      start: event.target.selectionStart,
      end: event.target.selectionEnd,
    });
  };

  const getLinePosition = (idx: number, text: string) => {
    const linesBeforeIdx = text.slice(0, idx).split("\n");
    const line = linesBeforeIdx.length - 1;
    const pos = linesBeforeIdx[line].length;
    return { line, pos };
  };

  const { line: currLine, pos: currPos } =
    linePosition || getLinePosition(selection.start, text);
  const lineCount = text.split("\n").length;
  const x = currPos * boxSize + (textAreaPadding + textAreaBorder);
  const y = currLine * boxSize + (textAreaPadding + textAreaBorder);
  const caretBehindHash =
    selection.start === selection.end && text[selection.start] === "#";
  return (
    <div className="Grid" style={{ position: "relative" }}>
      <div
        className="TextareaWrapper"
        style={{
          fontSize: fontSize,
          minHeight:
            boxSize * minHeight + (textAreaPadding + textAreaBorder) * 2,
          height: lineCount * boxSize + (textAreaPadding + textAreaBorder) * 2,
          width:
            Math.max(...text.split("\n").map((line) => line.length + 1)) *
              fontSize *
              1.25 +
            4,
        }}
      >
        <div
          className="Cursor"
          key={`${x},${y}`}
          style={{
            top: y,
            left: x,
            width: boxSize / 4,
            height: boxSize,
            zIndex: caretBehindHash ? 2 : 1,
            opacity: caretBehindHash ? 0.5 : 1,
          }}
        ></div>
        <textarea
          value={text}
          ref={textareaRef}
          className="Textarea"
          spellCheck={false}
          onChange={handleTextChange}
          onSelect={handleSelectionChange}
          //onKeyDown={handleKeyDown}
          //onKeyUp={handleKeyUp}
          //onBlur={handleBlur}
          //onFocus={handleFocus}
          autoFocus={true}
        />
      </div>
    </div>
  );
}
