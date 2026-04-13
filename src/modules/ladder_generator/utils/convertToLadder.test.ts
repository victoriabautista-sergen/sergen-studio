import { describe, expect, it } from "vitest";
import { convertToLadder } from "./convertToLadder";

describe("convertToLadder", () => {
  it("detecta AND como operador principal y conserva el OR como sub-bloque", () => {
    const result = convertToLadder("M := D AND (NOT E OR F);");

    expect(result.errors).toEqual([]);
    expect(result.rungs[0]).toEqual({
      output: "M",
      block: {
        type: "series",
        children: [
          {
            type: "contact",
            contact: { name: "D", negated: false },
          },
          {
            type: "parallel",
            branches: [
              {
                type: "contact",
                contact: { name: "E", negated: true },
              },
              {
                type: "contact",
                contact: { name: "F", negated: false },
              },
            ],
          },
        ],
      },
    });
  });

  it("mantiene un paralelo inicial completo antes del contacto en serie", () => {
    const result = convertToLadder("M := (A OR B) AND NOT C;");

    expect(result.errors).toEqual([]);
    expect(result.rungs[0].block).toEqual({
      type: "series",
      children: [
        {
          type: "parallel",
          branches: [
            {
              type: "contact",
              contact: { name: "A", negated: false },
            },
            {
              type: "contact",
              contact: { name: "B", negated: false },
            },
          ],
        },
        {
          type: "contact",
          contact: { name: "C", negated: true },
        },
      ],
    });
  });

  it("construye cada rama OR como bloque completo sin insertar contactos fuera de la bifurcación", () => {
    const result = convertToLadder("M := A AND (B OR C AND D);");

    expect(result.errors).toEqual([]);
    expect(result.rungs[0].block).toEqual({
      type: "series",
      children: [
        {
          type: "contact",
          contact: { name: "A", negated: false },
        },
        {
          type: "parallel",
          branches: [
            {
              type: "contact",
              contact: { name: "B", negated: false },
            },
            {
              type: "series",
              children: [
                {
                  type: "contact",
                  contact: { name: "C", negated: false },
                },
                {
                  type: "contact",
                  contact: { name: "D", negated: false },
                },
              ],
            },
          ],
        },
      ],
    });
  });
});