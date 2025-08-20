import { useEffect,  useRef, useState } from "react"
import { init as csRenderInit, RenderingEngine } from '@cornerstonejs/core';
import {Enums, type Types, volumeLoader, cornerstoneStreamingImageVolumeLoader } from "@cornerstonejs/core"

import { init as csToolsInit } from '@cornerstonejs/dicom-image-loader';
import {init as dicomImageLoaderInit} from "@cornerstonejs/dicom-image-loader"

function App () {
    const elementRef = useRef<HTMLDivElement>(null)
    const running = useRef(false)
    
    useEffect(()=> {
        const setup = async () => {
            if(running.current){
                return
            }
        running.current = true
        
        await csRenderInit()
        await csToolsInit()
        dicomImageLoaderInit({maxWebWorkers:4})

        const element = elementRef.current
        if (!element) return

        const imageIds = await createImageIdsAndCacheMetaData({
            //todo 백엔드 서버쪽으로 요청을 해야함.
        })
    const renderingEngineId = "myRenderingEngine"
    const renderingEngine = new RenderingEngine(renderingEngineId)
    const viewportId = "CT"

    const viewportInput = {
        viewportId,
        type: Enums.ViewportType.ORTHOGRAPHIC,
        element,
        defaultOptions: {
            orientation: Enums.OrientationAxis.SAGITTAL,
        },

    }
    renderingEngine.enableElement(viewportInput);
    const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport
    const volumeId = "streamingImageVolume"
    const volume = await volumeLoader.createAndCacheVolume(volumeId, {
        imageIds,
      })

    volume.load()  
    viewport.setVolumes([{ volumeId}])
    viewport.render()
    }
    setup()
    }, [elementRef, running])

    return (
        <div
        ref={elementRef}
        style={{
            width: "512px",
            height: "512px",
            backgroundColor: "#000",
        }}
        ></div>
    )
}

export default App