import { setup as setup1 } from './song'
import { setup as setup2 } from './music-player'

export { useSong } from './song'
export { useMusicPlayer } from './music-player'

export const setup = () => {
  setup1()
  setup2()
}
