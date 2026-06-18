/**
 * Agent 子工具循环引用检测。
 *
 * 场景：编辑 Agent A 时选择 Agent B 作为子工具，若 B 已（直接或间接）引用 A，
 * 则形成 A → B → … → A 的环，运行时会无限递归。
 *
 * 仅检测 refType 为 platform_agent_tools 的 Agent → Agent 引用链。
 */

/** 子工具引用类型：平台 Agent 工具 */
export const AGENT_SUBTOOL_REF_TYPE = 'platform_agent_tools';

/** 从子工具列表中提取 Agent 类型的子工具 ID 集合 */
export function extractAgentChildIds(subtoolList) {
  const ids = new Set();
  if (!Array.isArray(subtoolList)) return ids;
  for (const st of subtoolList) {
    const refType = st.refType ?? st.ref_type;
    const refId = st.refId ?? st.ref_id;
    if (refType === AGENT_SUBTOOL_REF_TYPE && refId != null && refId !== '') {
      ids.add(String(refId));
    }
  }
  return ids;
}

/** 构建 Agent 引用邻接表：agentId → 其直接引用的 Agent 子工具 ID 集合 */
export function buildAgentSubToolAdjacency(subtoolsByAgentId) {
  const graph = new Map();
  for (const [agentId, subtools] of subtoolsByAgentId.entries()) {
    graph.set(String(agentId), extractAgentChildIds(subtools));
  }
  return graph;
}

/**
 * 判断将 candidate 选为当前工具的子工具是否会产生环。
 * 从 candidate 向下 BFS，检查能否到达 currentToolId。
 * @returns {'direct'|'indirect'|null} direct=直接引用，indirect=间接引用，null=安全
 */
export function getAgentToolCycleRefType(candidateId, currentToolId, graph) {
  if (candidateId == null || currentToolId == null) return null;
  const candidate = String(candidateId);
  const current = String(currentToolId);
  if (candidate === current) return null;

  const directChildren = graph.get(candidate);
  if (directChildren?.has(current)) return 'direct';

  const visited = new Set([candidate]);
  const queue = [candidate];
  while (queue.length) {
    const node = queue.shift();
    const children = graph.get(node);
    if (!children) continue;
    for (const child of children) {
      if (child === current) return 'indirect';
      if (!visited.has(child)) {
        visited.add(child);
        queue.push(child);
      }
    }
  }
  return null;
}

/** 根据环类型返回前端提示文案 */
export function getAgentToolCycleTooltip(refType) {
  if (refType === 'direct') {
    return '该工具已引用了当前工具，选择会导致循环引用';
  }
  if (refType === 'indirect') {
    return '该工具间接引用了当前工具，选择会导致循环引用';
  }
  return '';
}

/** 批量拉取所有 Agent 的子工具关系，供环检测构建引用图 */
export async function fetchAllAgentSubToolRelations(agentIds, getAgentSubToolsByMainId) {
  const subtoolsByAgentId = new Map();
  await Promise.all(
    (agentIds || []).map(async (id) => {
      const idStr = String(id);
      try {
        const res = await getAgentSubToolsByMainId(id);
        if (res.code === 0 || res.code === 200 || res.success) {
          subtoolsByAgentId.set(idStr, res.result || res.data || []);
        } else {
          subtoolsByAgentId.set(idStr, []);
        }
      } catch {
        subtoolsByAgentId.set(idStr, []);
      }
    })
  );
  return subtoolsByAgentId;
}
