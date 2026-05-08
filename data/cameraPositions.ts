export type CameraPos = {
  position: [number, number, number]
  target: [number, number, number]
}

export const categoryCamera: Record<string, CameraPos> = {
  "Foundation":         { position: [9,  3, 13], target: [0, 0.5, 0] },
  "Ground Floor":       { position: [12, 7, 14], target: [0, 3,   0] },
  "Second Floor":       { position: [13, 10, 15], target: [0, 5.5, 0] },
  "Third Floor & Roof": { position: [14, 13, 16], target: [0, 8,   0] },
}

export const defaultCamera: CameraPos = {
  position: [14, 10, 16],
  target:   [0, 3, 0],
}
