import type { SimpleGit } from 'simple-git'
import { mkdir as _mkdir, copyFile, readdir, rm, writeFile } from 'node:fs/promises'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getErrorDescription, init, WzBinaryProperty, WzCanvasProperty, WzFile, WzFileParseStatus, WzMapleVersion } from '@tybys/wz'
import fg from 'fast-glob'
import { CleanOptions, simpleGit } from 'simple-git'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const outputDir = path.join(__dirname, '../dumped')

async function main() {
	await init()

	await rm(outputDir, { recursive: true }).catch(() => {})

	const bgmList = await dumpBgms()
	await dumpMapMarks()
	const bgmMarks = await collectBgmMarks()
	const data = bgmList.map(bgm => ({
		title: bgm.split('/').pop()!.replace('.mp3', ''),
		marks: bgmMarks[bgm.replace('.mp3', '')] ?? [],
		src: bgm,
	}))
	const jsonPath = path.join(outputDir, 'data', 'data.json')
	await mkdir(dirname(jsonPath))
	await writeFile(jsonPath, JSON.stringify(data), { encoding: 'utf-8' })

	await copyFile(path.join(__dirname, '../.gitignore'), path.join(outputDir, 'data', '.gitignore'))
	const git: SimpleGit = simpleGit(path.join(outputDir, 'data')).clean(CleanOptions.FORCE)
	await git.init()
	await git.branch(['-m', 'master'])
	await git.add('.')
	await git.commit('publish')
	await git.push('https://github.com/maple-pod/data.git', 'master', ['-f'])
}

main()

async function mkdir(dir: string) {
	await _mkdir(dir, { recursive: true }).catch(() => {})
}

async function dumpBgms() {
	const bgmList: string[] = []

	const root = '/Users/deviltea/Documents/MapleStory/Data/Sound'
	const files = (await readdir(root))
		.filter(file => file.startsWith('Sound_') && file.endsWith('.wz'))
		.map(file => path.join(root, file))

	for (const file of files) {
		const wz = new WzFile(file, WzMapleVersion.BMS)
		const r = await wz.parseWzFile()
		if (r !== WzFileParseStatus.SUCCESS) {
			throw new Error(getErrorDescription(r))
		}

		const mainDirectory = wz.wzDirectory
		const wzImages = [...mainDirectory?.wzImages ?? []]
			.filter(wzImage => wzImage.name.startsWith('Bgm'))
		for (const wzImage of wzImages) {
			await wzImage.parseImage()

			const wzImageName = wzImage.name
			const wzProperties = [...wzImage.wzProperties]
			for (const wzProperty of wzProperties) {
				if (wzProperty instanceof WzBinaryProperty) {
					const thePath = path.join(wzImageName.replace('.img', ''), `${wzProperty.name}.mp3`)
					bgmList.push(thePath)
					await wzProperty.saveToFile(path.join(outputDir, 'bgm', thePath))
				}
			}
		}
		wz.dispose()
	}
	const jsonPath = path.join(outputDir, 'data', 'bgmList.json')
	await mkdir(dirname(jsonPath))
	await writeFile(jsonPath, JSON.stringify(bgmList), { encoding: 'utf-8' })
	console.log(`Dumped ${bgmList.length} bgm files to`, path.join(outputDir, 'bgm'))
	await copyFile(path.join(__dirname, '../.gitignore'), path.join(outputDir, 'bgm', '.gitignore'))
	const git: SimpleGit = simpleGit(path.join(outputDir, 'bgm')).clean(CleanOptions.FORCE)
	await git.init()
	await git.branch(['-m', 'master'])
	await git.add('.')
	await git.commit('publish')
	await git.push('https://github.com/maple-pod/bgm.git', 'master', ['-f'])
	return bgmList
}

async function dumpMapMarks() {
	const root = '/Users/deviltea/Documents/MapleStory/Data/Map/_Canvas'
	const wz = new WzFile(path.join(root, '_Canvas_008.wz'), WzMapleVersion.BMS)
	const r = await wz.parseWzFile()
	if (r !== WzFileParseStatus.SUCCESS) {
		throw new Error(getErrorDescription(r))
	}

	const mainDirectory = wz.wzDirectory!
	await mainDirectory.parseDirectory()
	const mapHelperImg = mainDirectory.getImageByName('MapHelper.img')!
	await mapHelperImg.parseImage()
	const wzProperties = mapHelperImg.getFromPath('mark')!.wzProperties!

	await mkdir(path.join(outputDir, 'mark'))

	const markList: string[] = []
	for (const wzProperty of wzProperties) {
		if (wzProperty instanceof WzCanvasProperty) {
			await wzProperty.pngProperty!.saveToFile(path.join(outputDir, 'mark', `${wzProperty.name}.png`))
			markList.push(`${wzProperty.name}.png`)
		}
	}
	const jsonPath = path.join(outputDir, 'data', 'markList.json')
	await mkdir(dirname(jsonPath))
	await writeFile(jsonPath, JSON.stringify(markList), { encoding: 'utf-8' })
	wz.dispose()
	console.log(`Dumped ${markList.length} mark files to`, path.join(outputDir, 'mark'))
	await copyFile(path.join(__dirname, '../.gitignore'), path.join(outputDir, 'bgm', '.gitignore'))
	const git: SimpleGit = simpleGit(path.join(outputDir, 'mark')).clean(CleanOptions.FORCE)
	await git.init()
	await git.branch(['-m', 'master'])
	await git.add('.')
	await git.commit('publish')
	await git.push('https://github.com/maple-pod/mark.git', 'master', ['-f'])
	return markList
}

async function collectBgmMarks() {
	const _bgmMarks: Record<string, Set<string>> = {}
	for (const file of fg.sync('/Users/deviltea/Documents/MapleStory/Data/Map/Map/Map*/Map*_0*.wz')) {
		const wz = new WzFile(file, WzMapleVersion.BMS)
		const r = await wz.parseWzFile()
		if (r !== WzFileParseStatus.SUCCESS) {
			throw new Error(getErrorDescription(r))
		}

		const mainDirectory = wz.wzDirectory!
		await mainDirectory.parseDirectory()
		for (const wzImage of mainDirectory.wzImages) {
			await wzImage.parseImage()
			const bgm = wzImage.getFromPath('info/bgm')?.wzValue
			const mark = wzImage.getFromPath('info/mapMark')?.wzValue
			if (bgm == null || mark == null)
				continue
			if (_bgmMarks[bgm] == null)
				_bgmMarks[bgm] = new Set<string>()
			_bgmMarks[bgm]!.add(mark)
		}
		wz.dispose()
	}
	const jsonPath = path.join(outputDir, 'data', 'bgmMarks.json')
	await mkdir(dirname(jsonPath))
	const bgmMarks = Object.fromEntries(Object.entries(_bgmMarks).map(([k, v]) => [k, [...v]]))
	await writeFile(jsonPath, JSON.stringify(bgmMarks), { encoding: 'utf-8' })
	console.log(`Dumped bgmMarks mapping to`, dirname(jsonPath))
	return bgmMarks
}
