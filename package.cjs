const fs = require("fs")
const path = require("path")

const root = path.resolve('.')
const dist = path.join(root, "dist")

// create dist folder

if (fs.existsSync(dist)) fs.rmSync(dist, { recursive: true })
fs.mkdirSync(dist)

// copy base file

const copy_files = ["README.md", "LICENSE", "CHANGELOG.md"]

for (const file of copy_files) {
    fs.copyFileSync(path.join(root, file), path.join(dist, file))
}

// copy package.json

const pkg = require(path.join(root, "package.json"))

delete pkg.dependencies
delete pkg.devDependencies
delete pkg.scripts
delete pkg.source
delete pkg.module

pkg.main = "extension.js"

fs.writeFileSync(
    path.join(dist, "package.json"),
    `${JSON.stringify(pkg, null, 2)}\n`
)
