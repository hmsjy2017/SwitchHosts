/**
 * make
 * @author: oldj
 * @homepage: https://oldj.net
 */

require('dotenv').config()
const version = require('../src/version.json')
const builder = require('electron-builder')
const myExec = require('./libs/my_exec')
const fse = require('fs-extra')
const homedir = require('os').homedir()
const path = require('path')

const root_dir = path.normalize(path.join(__dirname, '..'))
const dist_dir = path.normalize(path.join(__dirname, '..', 'dist'))

const electronLanguages = ['en', 'fr', 'zh_CN', 'de']

const TARGET_PLATFORMS_configs = {
  mac: {
    mac: ['default'],
  },
  macs: {
    mac: ['dmg:x64', 'dmg:arm64'],
  },
  win: {
    win: ['nsis:ia32', 'nsis:x64', 'portable:ia32'],
  },
  linux: {
    linux: ['AppImage:arm64', 'deb:arm64', 'AppImage:armv7l', 'deb:armv7l'],
  },
  all: {
    mac: ['dmg:x64', 'dmg:arm64', 'dmg:universal'],
    linux: ['AppImage:x64', 'deb:x64'],
    win: ['nsis:ia32', 'nsis:x64', 'portable:ia32'],
  },
}

const APP_NAME = 'SwitchHosts'
const { IDENTITY } = process.env

const cfg_common = {
  copyright: `Copyright © ${new Date().getFullYear()}`,
  buildVersion: version[3].toString(),
  directories: {
    buildResources: 'build',
    app: 'build',
  },
  electronDownload: {
    cache: path.join(homedir, '.electron'),
    mirror: 'https://npm.taobao.org/mirrors/electron/',
  },
}

const beforeMake = async () => {
  console.log('-> beforeMake...')
  fse.removeSync(dist_dir)
  fse.ensureDirSync(dist_dir)

  const to_cp = [
    [
      path.join(root_dir, 'assets', 'app.png'),
      path.join(root_dir, 'build', 'assets', 'app.png'),
    ],
  ]

  to_cp.map(([src, target]) => {
    fse.copySync(src, target)
  })

  let pkg_base = require(path.join(root_dir, 'package.json'))
  let pkg_app = require(path.join(root_dir, 'app', 'package.json'))

  pkg_app.name = APP_NAME
  pkg_app.version = version.slice(0, 3).join('.')
  pkg_app.dependencies = pkg_base.dependencies

  fse.writeFileSync(
    path.join(root_dir, 'build', 'package.json'),
    JSON.stringify(pkg_app, null, 2),
    'utf-8',
  )
}

const afterMake = async () => {
  console.log('-> afterMake...')
}

const doMake = async () => {
  console.log('-> make...')

  let targets = TARGET_PLATFORMS_configs.all
  if (process.env.MAKE_FOR === 'dev') {
    targets = TARGET_PLATFORMS_configs.macs
  } else if (process.env.MAKE_FOR === 'mac') {
    targets = TARGET_PLATFORMS_configs.mac
  } else if (process.env.MAKE_FOR === 'win') {
    targets = TARGET_PLATFORMS_configs.win
  }

  await builder.build({
    //targets: Platform.MAC.createTarget(),
    ...targets,
    config: {
      ...cfg_common,
      appId: 'SwitchHosts',
      productName: APP_NAME,
      mac: {
        type: 'distribution',
        category: 'public.app-category.productivity',
        icon: 'assets/app.icns',
        gatekeeperAssess: false,
        electronLanguages,
        identity: IDENTITY,
        hardenedRuntime: true,
        entitlements: 'scripts/entitlements.mac.plist',
        entitlementsInherit: 'scripts/entitlements.mac.plist',
        provisioningProfile: 'scripts/app.provisionprofile',
        extendInfo: {
          ITSAppUsesNonExemptEncryption: false,
          CFBundleLocalizations: electronLanguages,
          CFBundleDevelopmentRegion: 'en',
        },
      },
      dmg: {
        //backgroundColor: '#f1f1f6',
        background: 'assets/dmg-bg.png',
        //icon: 'assets/dmg-icon.icns',
        iconSize: 160,
        window: {
          width: 600,
          height: 420,
        },
        contents: [
          {
            x: 150,
            y: 200,
          },
          {
            x: 450,
            y: 200,
            type: 'link',
            path: '/Applications',
          },
        ],
        sign: false,
        artifactName:
          '${productName}_mac_${arch}_${version}(${buildVersion}).${ext}',
      },
      win: {
        icon: 'assets/app.ico',
        //requestedExecutionLevel: 'requireAdministrator'
      },
      nsis: {
        installerIcon: 'assets/installer-icon.ico',
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        artifactName:
          '${productName}_installer_${arch}_${version}(${buildVersion}).${ext}',
      },
      portable: {
        artifactName:
          '${productName}_portable_${arch}_${version}(${buildVersion}).${ext}',
      },
      linux: {
        icon: 'assets/app.png',
        artifactName:
          '${productName}_linux_${arch}_${version}(${buildVersion}).${ext}',
        category: 'Utility',
        synopsis: 'An App for hosts management and switching.',
        desktop: {
          Name: 'SwitchHosts',
          Type: 'Application',
          GenericName: 'An App for hosts management and switching.',
        },
      },
    },
  })

  console.log('done!')
}

;(async () => {
  try {
    await beforeMake()
    await doMake()
    await afterMake()
    console.log('-> make Done!')
  } catch (e) {
    console.error(e)
  }
})()
