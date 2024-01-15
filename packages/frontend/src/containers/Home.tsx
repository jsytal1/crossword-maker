import Form from "react-bootstrap/Form";

import "./Home.css";

import LoaderButton from "../components/LoaderButton";
import GridInput from "../components/GridInput";
import Grid from "../components/Grid";
import { API } from "aws-amplify";
import { useState } from "react";
import { GridConfigType } from "../types/grid-config";
import { onError } from "../lib/errorLib";

export default function Home() {
  const [layout, setLayout] = useState("_____TASTE_______________");
  const [solutions, setSolutions] = useState<Array<string>>([]);

  const [isLoading, setIsLoading] = useState(false);

  function validateForm() {
    return layout.length > 0;
  }

  function createGridConfig(gridConfig: GridConfigType) {
    return API.post("grid-configs", "/grid-configs/solve", {
      body: gridConfig,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    try {
      //const attachment = file.current
      //  ? await s3Upload(file.current)
      //  : undefined;

      const solutions = await createGridConfig({
        layout: layout,
        width: 5,
        height: 5,
        //attachment,
      });
      setSolutions(solutions);
      setIsLoading(false);
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
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
        {/*
        <Form.Group className="mt-2" controlId="file">
          <Form.Label>Attachment</Form.Label>
          <Form.Control onChange={handleFileChange} type="file" />
        </Form.Group>
        */}
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
    </div>
  );
}
