/** App 编辑页挂载 MCP 服务时使用的模板定义 */
export const MCP_TEMPLATES = {
  MCPServerStreamable: {
    name: 'MCPServerStreamable',
    label: 'MCP Streamable 服务',
    config_schema: [
      {
        name: 'name',
        type: 'string',
        label: '服务名',
        default: '',
        required: true,
        configVisible: false,
        createVisible: true,
      },
      {
        name: 'url',
        type: 'string',
        label: 'MCP 端点 URL',
        default: '',
        required: true,
        configVisible: false,
        createVisible: true,
      },
      {
        name: 'headers',
        type: 'object',
        class: 'DICT',
        label: 'HTTP 请求头',
        default: {},
        configVisible: false,
        createVisible: true,
      },
    ],
  },
}

export const DEFAULT_MCP_TEMPLATE = 'MCPServerStreamable'

export function getMcpTemplate(templateKey = DEFAULT_MCP_TEMPLATE) {
  return MCP_TEMPLATES[templateKey] || MCP_TEMPLATES[DEFAULT_MCP_TEMPLATE]
}
