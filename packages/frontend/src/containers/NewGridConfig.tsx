import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import { useNavigate } from "react-router-dom";
import { API } from "aws-amplify";
import { GridConfigType } from "../types/grid-config";
import { onError } from "../lib/errorLib";

import "./NewGridConfig.css";

import LoaderButton from "../components/LoaderButton";
import Grid from "../components/GridInput";

export default function NewGridConfig() {
  //const file = useRef<null | File>(null);
  const nav = useNavigate();
  const [layout, setLayout] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function validateForm() {
    return layout.length > 0;
  }

  /*
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.currentTarget.files === null) return;
    file.current = event.currentTarget.files[0];
  }
  */

  function createGridConfig(gridConfig: GridConfigType) {
    return API.post("grid-config", "/grid-configs", {
      body: gridConfig,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    /*
    if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${
          config.MAX_ATTACHMENT_SIZE / 1000000
        } MB.`
      );
      return;
    }
    */

    setIsLoading(true);

    try {
      //const attachment = file.current
      //  ? await s3Upload(file.current)
      //  : undefined;

      await createGridConfig({
        layout: layout,
        width: 5,
        height: 5,
        //attachment,
      });
      nav("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  return (
    <div className="NewGridConfig">
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="layout">
          <Grid
            width={5}
            height={5}
            content={"_____TASTE_______________"}
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
          Create
        </LoaderButton>
      </Form>
    </div>
  );
}
