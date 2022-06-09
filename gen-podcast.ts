import { parse as parseYAML } from "https://deno.land/std@0.129.0/encoding/yaml.ts";
import Schema, { Type, string, number, array } from 'https://denoporter.sirjosh.workers.dev/v1/deno.land/x/computed_types/src/index.ts';
import { MP3Duration } from "./mp3-duration.ts"

const config = {
  baseDir: "public",
  srcConfig: "feed.yml",
  dstConfig: "feed.xml",
  baseURL: "http://localhost:8080",// "https://stworzona.pl/podcast",
  language: "pl-pl",
  episodeFilename: (guid: string) => `episode-${guid}.xml`
}

const podcastConfig = loadPodcastConfig(config.baseDir, config.srcConfig)
const podcastXML = generatePodcastXML(config, podcastConfig)
Deno.writeTextFileSync(`${config.baseDir}/${config.dstConfig}`, podcastXML)
for (const episode of podcastConfig.episodes) {
  Deno.writeTextFileSync(
    config.baseDir + "/" + config.episodeFilename(getEpisodeGUID(episode)),
    generateEpisodeXML(config, podcastConfig, episode)
  )
}

function loadPodcastConfig(baseDir: string, path: string) {
  const PodcastConfigSchema = Schema({
    title: string.trim().normalize().between(3, 40),
    description: string.trim().normalize(),
    owner: {
      email: string.regexp(/^[a-zA-Z0-9\.! #$%&'*+/=? ^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/g)
    },
    author: {
      name: string.trim().normalize(),
    },
    maintainer: {
      name: string.trim().normalize(),
      link: string.trim().normalize(),
      group: {
        name: string.trim().normalize(),
        link: string.trim().normalize(),
      },
    },
    cover: {
      image_path: string.test((image_path) => Deno.statSync(`${baseDir}/${image_path}`).isFile)
    },
    itunes_categories: array.of(string.trim()),
    episodes: array.of({
      title: string.trim().normalize().between(3, 70),
      description: string.trim().normalize(),
      audio_path: string.test(audio_path => audio_path.endsWith(".mp3")).test(audio_path => Deno.statSync(`${baseDir}/${audio_path}`).isFile),
      date: string.transform(dateNoTZ => `${dateNoTZ}+01:00`).test(date => new Date(date).getTime() > 0).transform(date => new Date(date))
    }),
  }, { strict: true });
  const rawConfig = parseYAML(Deno.readTextFileSync(`${baseDir}/${path}`))
  const validator = PodcastConfigSchema.destruct();

  const [err, config] = validator(rawConfig as any);
  if (err) {
    throw err
  }
  return config!
}

function generatePodcastXML(globalConfig: typeof config, podcast: ReturnType<typeof loadPodcastConfig>): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet href="${globalConfig.baseURL}/stylesheet.xsl" type="text/xsl"?>
<rss version="2.0"
    xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${podcast.title}</title>
    <maintainer>
      <name>${podcast.maintainer.name}</name>
      <link>${podcast.maintainer.link}</link>
      <group>
        <name>${podcast.maintainer.group.name}</name>
        <link>${podcast.maintainer.group.link}</link>
      </group>
    </maintainer>
    <itunes:owner>
        <itunes:email>${podcast.owner.email}</itunes:email>
    </itunes:owner>
    <itunes:author>${podcast.author.name}</itunes:author>
    <description>${podcast.description}</description>
    <itunes:image href="${globalConfig.baseURL}/${podcast.cover.image_path}"/>
    <itunes:explicit>no</itunes:explicit>
    <image>
      <url>${globalConfig.baseURL}/${podcast.cover.image_path}</url>
      <title>${podcast.title}</title>
      <link>${globalConfig.baseURL}</link>
    </image>
    <language>${globalConfig.language}</language>
    <link>${globalConfig.baseURL}</link>
    ${podcast.itunes_categories.map(categoryName => `<itunes:category text="${categoryName}"/>`).join("\n")}
    ${podcast.episodes.map(episode => `
    <item>
      <title>${episode.title}</title>
      <description>${episode.description}</description>
      <pubDate>${episode.date.toUTCString()}</pubDate>
      <enclosure
        url="${globalConfig.baseURL}/${episode.audio_path}"
        type="audio/mpeg"
        length="${getFileSizeBytes(`${globalConfig.baseDir}/${episode.audio_path}`)}"
      />
      <itunes:duration>${getMP3DurationSeconds(`${globalConfig.baseDir}/${episode.audio_path}`)}</itunes:duration>
      <guid isPermaLink="false">${getEpisodeGUID(episode)}</guid>
    </item>
    `).join("\n\n")}
  </channel>
</rss>
  `
}

function generateEpisodeXML(globalConfig: typeof config, podcast: ReturnType<typeof loadPodcastConfig>, episode: ReturnType<typeof loadPodcastConfig>["episodes"][0]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <?xml-stylesheet href="${globalConfig.baseURL}/stylesheet-episode.xsl" type="text/xsl"?>
  <episode version="2.0">
    <podcast>
      <title>${podcast.title}</title>
      <link>${globalConfig.baseDir}</link>
      <feed>${globalConfig.baseDir}/${globalConfig.dstConfig}</feed>
    </podcast>
    <title>${episode.title}</title>
    <description>${episode.description}</description>
    <pubDate>${episode.date.toUTCString()}</pubDate>
    <enclosure
        url="${globalConfig.baseURL}/${episode.audio_path}"
        type="audio/mpeg"
        length="${getFileSizeBytes(`${globalConfig.baseDir}/${episode.audio_path}`)}"
    />
  </episode>
    `
}

function getFileSizeBytes(path: string): number {
  return Deno.lstatSync(path).size
}

function getMP3DurationSeconds(path: string) {
  return new MP3Duration().getDurationInSeconds(Deno.readFileSync(path))
}

function getEpisodeGUID(episode: { audio_path: string, date: Date }): string {
  return episode.date.getFullYear() + "_" + episode.audio_path.replaceAll(/[^a-zA-Z0-9]/g, "")
}
