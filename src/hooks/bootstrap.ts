import { init as coreInit } from "@cornerstonejs/core";
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader";
import { init as toolsInit, addTool } from "@cornerstonejs/tools";
import { ArrowAnnotateTool } from "@cornerstonejs/tools";

let ready = false;

export async function ensureCornerstoneReady() {
  if (ready) return;
  await coreInit();
  await dicomImageLoaderInit({ maxWebWorkers: 2 });
  await toolsInit();

  // 최소 렌더용 툴만 전역 등록 (필요 툴 추가 가능)
  addTool(ArrowAnnotateTool);

  ready = true;
}

