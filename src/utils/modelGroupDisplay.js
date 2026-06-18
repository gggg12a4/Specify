/**
 * 模型分组（modelGroups）展示工具。
 *
 * 后台存储格式不统一：可能是 JSON 数组字符串、逗号分隔 ID，或 null（表示全部平台）。
 * 列表页通常只加载部分分组详情，因此通过 nameCache 按需补全名称。
 */

/** 将 modelGroups 字段解析为 ID 数组；null/空 表示「全部平台」。 */
export function parseModelGroupIds(mg) {
  if (mg === null || mg === undefined || mg === '') return null;
  let mgArray = mg;
  if (typeof mg === 'string') {
    try {
      mgArray = JSON.parse(mg);
    } catch {
      mgArray = mg.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(mgArray) || mgArray.length === 0) return [];
  return mgArray.filter((id) => id !== null && id !== undefined && id !== '');
}

/** 用已加载的分组列表预热名称缓存，避免重复请求。 */
export function syncModelGroupNameCache(groups, nameCache) {
  (groups || []).forEach((g) => {
    const name = g.displayName || g.name;
    if (g.id != null && name) {
      nameCache[String(g.id)] = name;
    }
  });
}

/** 解析单个分组 ID 的展示名；找不到或名称等于 ID 时返回 null。 */
export function resolveModelGroupName(id, groups, nameCache) {
  const idStr = String(id);
  const fromList = (groups || []).find((g) => String(g.id) === idStr);
  const cached = nameCache[idStr] ?? nameCache[id];
  const name = fromList?.displayName || fromList?.name || (cached && cached !== null ? cached : null);
  if (!name || String(name) === idStr) return null;
  return name;
}

/** 对缓存中缺失的 ID 并发请求详情，结果写入 nameCache（失败记为 null）。 */
export async function fetchMissingModelGroupNames(ids, nameCache, getModelGroupById) {
  const idsToFetch = ids.filter((id) => {
    const idStr = String(id);
    return nameCache[idStr] === undefined && nameCache[id] === undefined;
  });

  await Promise.all(
    idsToFetch.map(async (id) => {
      const idStr = String(id);
      try {
        const res = await getModelGroupById(id);
        if (res.code === 0 || res.success || res.code === 200) {
          const data = res.result || res.data;
          const name = data?.displayName || data?.name;
          nameCache[idStr] = name && String(name) !== idStr ? name : null;
        } else {
          nameCache[idStr] = null;
        }
      } catch {
        nameCache[idStr] = null;
      }
    })
  );
}

/* 解析模型分组名称，返回类型和名称列表。 */
/* @returns {{ kind: 'all' | 'none' | 'names', names?: string[] }} */
function getResolvedModelGroupNames(mg, groups, nameCache) {
  const ids = parseModelGroupIds(mg);
  if (ids === null) return { kind: 'all' };
  if (ids.length === 0) return { kind: 'all' };
  const names = ids.map((id) => resolveModelGroupName(id, groups, nameCache)).filter(Boolean);
  if (!names.length) return { kind: 'none' };
  return { kind: 'names', names };
}

/** 完整展示 modelGroups，如「平台A, 平台B」；无配置时显示 emptyLabel。 */
export function formatModelGroupsDisplay(mg, groups, nameCache, emptyLabel = '全部平台') {
  const resolved = getResolvedModelGroupNames(mg, groups, nameCache);
  if (resolved.kind === 'all') return emptyLabel;
  if (resolved.kind === 'none') return '-';
  return resolved.names.join(', ');
}

/** 列表页截断展示，超出 max 个名称时追加「...」。 */
export function formatModelGroupsDisplayTruncated(
  mg,
  groups,
  nameCache,
  emptyLabel = '全部平台',
  max = 4
) {
  const resolved = getResolvedModelGroupNames(mg, groups, nameCache);
  if (resolved.kind === 'all') return emptyLabel;
  if (resolved.kind === 'none') return '-';
  if (resolved.names.length > max) {
    return `${resolved.names.slice(0, max).join(', ')}...`;
  }
  return resolved.names.join(', ');
}
