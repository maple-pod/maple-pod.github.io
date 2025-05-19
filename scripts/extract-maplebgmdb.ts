import { Buffer } from 'node:buffer'
import { mkdir as _mkdir, rm as _rm, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import ytdl from '@distube/ytdl-core'
import fg from 'fast-glob'
import ffmpeg from 'fluent-ffmpeg'
import { ofetch } from 'ofetch'
import path, { basename, relative } from 'pathe'
import simpleGit, { CleanOptions, type SimpleGit } from 'simple-git'

process.env.YTDL_NO_UPDATE = 'true'

interface MapleBgmItem {
	description: string
	filename: string
	mark: string
	metadata: {
		albumArtist: string
		artist: string
		title: string
		year: string
	}
	source: {
		client: string
		date: string
		structure: string
		version: string
	}
	youtube: string
}

interface OutputDataItem {
	title: string
	cover: string
	duration: number
	src: string

	data: MapleBgmItem
}

const CLEAR = false

const outputDir = fileURLToPath(new URL('../maplebgm', import.meta.url))
const dataDir = path.join(outputDir, 'data')
const bgmDir = path.join(outputDir, 'bgm')
const markDir = path.join(outputDir, 'mark')

const mkdir = (dir: string) => _mkdir(dir, { recursive: true }).catch(() => {})
const rm = (dir: string) => _rm(dir, { recursive: true, force: true }).catch(() => {})
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

let downloadedMarks: Set<string>
let downloadedBgms: Set<string>

async function prepareDirs() {
	if (CLEAR)
		await rm(outputDir)

	await mkdir(dataDir)
	await mkdir(bgmDir)
	await mkdir(markDir)

	downloadedMarks = new Set(fg.sync(path.join(markDir, '*.png')).map(file => path.basename(file)))
	downloadedBgms = new Set(fg.sync(path.join(bgmDir, '*.mp3')).map(file => path.basename(file)))
}

async function downloadMark(item: OutputDataItem) {
	const markFilename = `${item.data.mark}.png`
	const markUrl = `https://maplestory-music.github.io/mark/${markFilename}`
	const markPath = path.join(markDir, markFilename)

	if (downloadedMarks.has(markFilename)) {
		// console.log(`Mark for ${item.mark} already downloaded, skipping...`)
		return
	}

	const response = await ofetch(markUrl, { responseType: 'arrayBuffer' })
	await writeFile(markPath, Buffer.from(response))
	downloadedMarks.add(markFilename)
}

async function downloadBgm(item: OutputDataItem) {
	const bgmFilename = `${item.data.filename}.mp3`
	const bgmYoutubeId = item.data.youtube
	const bgmPath = path.join(bgmDir, bgmFilename)

	if (downloadedBgms.has(bgmFilename) === false) {
		await delay(5000) // To avoid hitting YouTube's rate limit
		await new Promise<void>((resolve, reject) => {
			const stream = ytdl(bgmYoutubeId, { quality: 'highestaudio', filter: 'audioonly' })
			ffmpeg(stream)
				.save(bgmPath)
				.on('end', () => resolve())
				.on('error', err => reject(err))
		})
		downloadedBgms.add(bgmFilename)
	}
	// console.log(`BGM ${bgmFilename} already downloaded, skipping...`)

	const duration = await new Promise<number>((resolve, reject) => {
		ffmpeg.ffprobe(bgmPath, (err, metadata) => {
			if (err)
				return reject(err)
			resolve(metadata.format.duration || 0)
		})
	})
	item.duration = duration
}

async function pushToRemote(target: 'bgm' | 'mark' | 'data') {
	const dir = path.join(outputDir, target)
	await rm(path.join(dir, '.git'))
	const git: SimpleGit = simpleGit(dir)
	await git.init(['--initial-branch=master'])
	await git.add('.')
	await git.commit('publish')
	await git.push(`https://github.com/maple-pod/${target}.git`, 'master', ['-f'])
}

async function main() {
	await prepareDirs()
	const outputData: OutputDataItem[] = (await ofetch<MapleBgmItem[]>('https://raw.githubusercontent.com/maplestory-music/maplebgm-db/prod/bgm.min.json', { responseType: 'json' }))
		.filter(item => item.youtube)
		.map<OutputDataItem>(item => ({
			title: item.metadata.title,
			cover: `/mark/${item.mark}.png`,
			duration: 0, // Duration will be set after downloading the audio
			src: `/bgm/${item.filename}.mp3`,
			data: item,
		}))
		.slice(0, 1)

	const errorLogs: { type: 'bgm' | 'mark', message: string }[] = []
	for (const item of outputData) {
		console.log(`Processing ${item.data.filename}...`)
		const [markResult, bgmResult] = await Promise.allSettled([
			downloadMark(item),
			downloadBgm(item),
		])
		if (markResult.status === 'rejected') {
			errorLogs.push({ type: 'mark', message: `Failed to download mark for ${item.data.mark}: ${markResult.reason}` })
		}
		if (bgmResult.status === 'rejected') {
			errorLogs.push({ type: 'bgm', message: `Failed to download BGM for ${item.data.mark}: ${bgmResult.reason}` })
		}
	}

	if (errorLogs.length > 0) {
		const errorLogPath = path.join(outputDir, `error-${Date.now()}.log`)
		console.error('Errors occurred during download', errorLogPath)
		await writeFile(errorLogPath, JSON.stringify(errorLogs, null, 2), { encoding: 'utf-8' })
	}

	await writeFile(path.join(dataDir, 'data.json'), JSON.stringify(outputData), { encoding: 'utf-8' })

	await delay(1000) // Wait for a second before pushing to remote

	await pushToRemote('data')
	await pushToRemote('mark')
	await pushToRemote('bgm')
}

main()
