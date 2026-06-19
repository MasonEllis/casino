import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Reflector } from 'three-stdlib'
import { MIRROR_REFLECTION_LAYER } from '../../game/mirror'

type MirrorSurfaceProps = {
  width: number
  height: number
  resolution?: number
  position?: [number, number, number]
}

export function MirrorSurface({
  width,
  height,
  resolution = 1024,
  position = [0, 0, 0],
}: MirrorSurfaceProps) {
  const reflector = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(width, height)
    const mesh = new Reflector(geometry, {
      clipBias: 0.003,
      textureWidth: resolution,
      textureHeight: resolution,
      color: new THREE.Color(0xffffff),
      multisample: 0,
    })

    const originalOnBeforeRender = mesh.onBeforeRender
    mesh.onBeforeRender = function (this: Reflector, ...args: Parameters<NonNullable<THREE.Mesh['onBeforeRender']>>) {
      mesh.camera.layers.set(0)
      mesh.camera.layers.enable(MIRROR_REFLECTION_LAYER)

      const scene = args[1] as THREE.Scene
      const savedFog = scene.fog
      scene.fog = null

      originalOnBeforeRender.apply(mesh, args)

      scene.fog = savedFog
    }

    return mesh
  }, [width, height, resolution])

  useLayoutEffect(() => () => reflector.dispose(), [reflector])

  return <primitive object={reflector} position={position} />
}