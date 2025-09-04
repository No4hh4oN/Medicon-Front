// src/components/annotationsFilter.ts
import { annotation, ToolGroupManager } from "@cornerstonejs/tools";

let _installed = false;

/** element 또는 toolGroupId 소유권이 있는 주석만 해당 뷰포트에서만 렌더 */
export function installScopedAnnotationFilterOnce() {
  if (_installed) return;
  const cfg: any = (annotation as any)?.config;
  if (!cfg?.setFilterPredicate) return;

  cfg.setFilterPredicate((ann: any, viewport: any) => {
    const vpEl = viewport?.element;

    // 1) element가 붙어 있으면 element 일치한 뷰포트에서만 보이기
    if (ann?.metadata?.element) {
      return ann.metadata.element === vpEl;
    }

    // 2) toolGroupId가 붙어 있으면 같은 툴그룹의 뷰포트에서만 보이기
    const tgOfVp =
      ToolGroupManager.getToolGroupForViewport?.(
        viewport?.id ?? viewport?.viewportId,
        viewport?.renderingEngineId
      ) ?? null;

    if (ann?.metadata?.toolGroupId && tgOfVp?.id) {
      return ann.metadata.toolGroupId === tgOfVp.id;
    }

    // 3) 소유권 정보가 전혀 없는 주석은 숨김(전역 노출 금지)
    return false;
  });

  _installed = true;
}
