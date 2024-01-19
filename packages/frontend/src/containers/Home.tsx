import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";

import "./Home.css";

import LoaderButton from "../components/LoaderButton";
import GridInput2 from "../components/GridInput2";
import Grid from "../components/Grid";
import { API } from "aws-amplify";
import { useState } from "react";
import { GridConfigType } from "../types/grid-config";

export default function Home() {
  const [layout, setLayout] = useState("     \n".repeat(5));
  const [solutions, setSolutions] = useState<Array<string>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReset, setIsReset] = useState(true);

  async function getSolutions(): Promise<Array<string>> {
    const solutions = await createGridConfig({
      layout: layout,
    });
    return solutions;
  }

  function validateForm() {
    return layout.length > 0;
  }

  function createGridConfig(gridConfig: GridConfigType) {
    return API.post("grid-configs", "/grid-configs/go-solve", {
      body: gridConfig,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    const solutions = await getSolutions();
    setIsReset(false);
    setSolutions(solutions);
    setIsLoading(false);
  }

  function renderGridList(grids: string[]) {
    return (
      <div className="Solutions">
        {grids.map((grid) => (
          <Grid key={grid} content={grid} />
        ))}
      </div>
    );
  }

  return (
    <div className="Home">
      <div className="lander">
        <h1>Make Me Cross</h1>
        <p>A Crossword Building app</p>
      </div>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="layout">
          <Form.Label>Crossword Layout</Form.Label>

          <Row>
            <Form.Text>
              <p>
                Type [Space] for an Empty White Square
                <br />
                Type [#] for a "Black" Square
                <br />
                Type [A-Z] for a pre-filled Square
                <br />
                Max word length is 5.
              </p>
            </Form.Text>
          </Row>
          <GridInput2 onUpdate={(newValue: string) => setLayout(newValue)} />
        </Form.Group>
        <LoaderButton
          size="lg"
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={!validateForm()}
        >
          Find
        </LoaderButton>
      </Form>
      {solutions.length > 0 && renderGridList(solutions)}
      {solutions.length === 0 && isReset === false && (
        <span>No solutions found</span>
      )}
    </div>
  );
}
