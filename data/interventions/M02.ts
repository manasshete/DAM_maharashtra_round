export interface InterventionLevel {
  level: number;
  type: "HINT" | "EXPLANATION" | "WORKED_EXAMPLE" | "GUIDED_PRACTICE";
  content: string;
}

export interface InterventionSpec {
  misconceptionId: string;
  levels: InterventionLevel[];
}

export const M02_INTERVENTION: InterventionSpec = {
  misconceptionId: "M02",
  levels: [
    {
      level: 1,
      type: "HINT",
      content: "Wait a second... does Python start counting items at 1, or somewhere else?"
    },
    {
      level: 2,
      type: "EXPLANATION",
      content: "Python list indexing starts at 0, not 1. When you ask for items[1], you are actually asking for the SECOND item in the list."
    },
    {
      level: 3,
      type: "WORKED_EXAMPLE",
      content: "Let's look at an example: \n`fruits = ['apple', 'banana', 'cherry']`\n- `fruits[0]` gives you 'apple' (the first item)\n- `fruits[1]` gives you 'banana' (the second item)\nNotice how the index is always one less than the item's position."
    },
    {
      level: 4,
      type: "GUIDED_PRACTICE",
      content: "If you have `colors = ['red', 'blue', 'green']`, what exactly would you type to get the very first color ('red')?"
    }
  ]
};
