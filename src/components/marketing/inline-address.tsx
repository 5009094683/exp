import { Fragment } from "react";

/**
 * A postal address written as running text, for places with little vertical
 * room. Each configured line stays together, so the text wraps between lines
 * of the address and not in the middle of one, such as between a city and its
 * postal code.
 */
export function InlineAddress({ lines }: { lines: string[] }) {
  return lines.map((line, index) => (
    <Fragment key={`${index}:${line}`}>
      <span className="inline-block">
        {line}
        {index < lines.length - 1 ? "," : null}
      </span>{" "}
    </Fragment>
  ));
}
