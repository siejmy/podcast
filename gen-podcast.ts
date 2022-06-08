import { parse as parseYAML } from "https://deno.land/std@0.129.0/encoding/yaml.ts";
import Schema, { Type, string, number, array } from 'https://denoporter.sirjosh.workers.dev/v1/deno.land/x/computed_types/src/index.ts';

const baseDir = "public"
const src = "feed.yml"
const dst = "feed.xml"

const podcastConfig = loadPodcastConfig(baseDir, src)
console.log(podcastConfig)

function loadPodcastConfig(baseDir: string, path: string) {
  const PodcastConfigSchema = Schema({
    title: string.trim().normalize().between(3, 40),
    description: string.trim().normalize(),
    owner: {
      email: string.regexp(/^[a-zA-Z0-9\.! #$%&'*+/=? ^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/g)
    },
    cover: {
      image_path: string.test((image_path) => Deno.statSync(`${baseDir}/${image_path}`).isFile)
    },
    episodes: array.of({
      title: string.trim().normalize().between(3, 70),
      description: string.trim().normalize(),
      audio_path: string.test(audio_path => Deno.statSync(`${baseDir}/${audio_path}`).isFile),
      date: string.test(date => new Date(date).getTime() > 0)
    }),
  }, { strict: true });
  const rawConfig = parseYAML(Deno.readTextFileSync(`${baseDir}/${src}`))
  const validator = PodcastConfigSchema.destruct();

  const [err, config] = validator(rawConfig as any);
  if (err) {
    throw err
  }
  return config
}
