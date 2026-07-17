export interface DeclarativeFieldDefinition {
  name: string;
  type: 'search' | 'text';
  description: string;
  required: boolean;
}

export interface DeclarativeToolDefinition {
  toolname: string;
  tooldescription: string;
  fields: readonly DeclarativeFieldDefinition[];
}

export interface DeclarativeToolPreview {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: 'string'; description: string }>;
    required: string[];
  };
}

/**
 * 將宣告式表單的已知欄位整理為教學用結構預覽。
 * 此函式不會註冊 Tool，也不代表 Agent 已發現任何能力。
 */
export function createDeclarativeToolPreview(definition: DeclarativeToolDefinition): DeclarativeToolPreview {
  const properties = Object.fromEntries(
    definition.fields.map((field) => [field.name, { type: 'string' as const, description: field.description }])
  );

  return {
    name: definition.toolname,
    description: definition.tooldescription,
    inputSchema: {
      type: 'object',
      properties,
      required: definition.fields.filter((field) => field.required).map((field) => field.name)
    }
  };
}
