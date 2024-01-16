import Form from "react-bootstrap/Form";

import "./Home.css";

import LoaderButton from "../components/LoaderButton";
import GridInput from "../components/GridInput";
import Grid from "../components/Grid";
import { API } from "aws-amplify";
import { useState, useEffect } from "react";
import { GridConfigType } from "../types/grid-config";
import { onError } from "../lib/errorLib";

export default function Home() {
  const [layout, setLayout] = useState("_____WORDS_______________");
  const [solutions, setSolutions] = useState<Array<string>>([
    "ALGAEWORDSAFOOTSTOREHYMNS",
  ]);
  const [isLoading, setIsLoading] = useState(false);

  //useEffect(() => {
  //  async function onLoad() {
  //    try {
  //      const solutions = await getSolutions();
  //      setSolutions(solutions);
  //    } catch (e) {
  //      onError(e);
  //    }

  //    setIsLoading(false);
  //  }

  //  onLoad();
  //}, []);

  async function getSolutions(): Promise<Array<string>> {
    const solutions = await createGridConfig({
      layout: layout,
      width: 5,
      height: 5,
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
    setSolutions(solutions);
    setIsLoading(false);
  }

  function renderGridList(grids: string[]) {
    return (
      <div className="Solutions">
        {grids.map((grid) => (
          <Grid key={grid} width={5} height={5} content={grid} />
        ))}
      </div>
    );
  }

  return (
    <div className="Home">
      <div className="lander">
        <h1>Make Me Cross</h1>
        <p className="text-muted">A Crossword Building app</p>
      </div>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="layout">
          <GridInput
            width={5}
            height={5}
            content={layout}
            onUpdate={(newValue: string) => setLayout(newValue)}
          />
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
      {solutions.length === 0 && <span>No solutions found</span>}
    </div>
  );
}
