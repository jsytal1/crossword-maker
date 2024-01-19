import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";

import "./Home.css";

import LoaderButton from "../components/LoaderButton";
import GridInput2 from "../components/GridInput2";
import Grid from "../components/Grid";
import { API } from "aws-amplify";
import { useState } from "react";
import { GridConfigType } from "../types/grid-config";
import { onError } from "../lib/errorLib";
import { LinkContainer } from "react-router-bootstrap";
import { Nav } from "react-bootstrap";

interface HomeProps {
  lang: string;
}

interface Data {
  title: string;
  subtitle: string;
  fieldLabel: string;
  instructions: Array<string>;
  searchLabel: string;
  noResultsText: string;
}

interface DataByLang {
  [key: string]: Data;
}

export default function Home({ lang }: HomeProps) {
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
    return API.post("grid-configs", `/grid-configs/solve-${lang}`, {
      body: gridConfig,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const solutions = await getSolutions();
      setIsReset(false);
      setSolutions(solutions);
    } catch (e) {
      onError(e);
    }
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

  const data_by_lang: DataByLang = {
    en: {
      title: "Make Me Cross",
      subtitle: "A Crossword Building app",
      fieldLabel: "Crossword Layout",
      instructions: [
        "Type [Space] for an Empty White Square",
        'Type [#] for a "Black" Square',
        "Type [A-Z] for a pre-filled Square",
        "Max word length is 5",
      ],
      searchLabel: "Search",
      noResultsText: "No results found",
    },
    pl: {
      title: "Krzyżówki",
      subtitle: "Aplikacja do budowania krzyżówek",
      fieldLabel: "Układ krzyżówki",
      instructions: [
        "Wpisz [Spację] dla Pustego Białego Kwadratu",
        'Wpisz [#] dla "Czarnego" Kwadratu',
        "Wpisz [A-Z] dla Kwadratu z Wypełnieniem",
        "Maksymalna długość słowa to 5",
      ],
      searchLabel: "Szukaj",
      noResultsText: "Nie znaleziono wyników",
    },
  };

  const data = data_by_lang[lang];

  return (
    <div className="Home">
      <div className="lander">
        <h1>{data.title}</h1>
        <p>{data.subtitle}</p>
        <LinkContainer to="/">
          <Nav.Link>English</Nav.Link>
        </LinkContainer>
        <LinkContainer to="/pl">
          <Nav.Link>Polski</Nav.Link>
        </LinkContainer>
      </div>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="layout">
          <Form.Label>{data.fieldLabel}</Form.Label>

          <Row>
            <Form.Text>
              <p>
                {data.instructions.map((instruction: string) => (
                  <span key={instruction}>
                    {instruction}
                    <br />
                  </span>
                ))}
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
          {data.searchLabel}
        </LoaderButton>
      </Form>
      {solutions.length > 0 && renderGridList(solutions)}
      {solutions.length === 0 && isReset === false && (
        <span>{data.noResultsText}</span>
      )}
    </div>
  );
}
