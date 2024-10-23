import type { AppHost } from '@shared/app'
import { ForkPromise } from '@shared/ForkPromise'
import { dirname, join } from 'path'
import { existsSync, mkdirp, remove, writeFile } from 'fs-extra'
import { execPromise, waitTime } from '../../Fn'
import { I18nT } from '../../lang'
import { execPromiseRoot } from '@shared/Exec'
import { getHostItemEnv, ServiceItem } from './ServiceItem'

export class ServiceItemJavaSpring extends ServiceItem {
  start(item: AppHost): ForkPromise<boolean> {
    return new ForkPromise<boolean>(async (resolve, reject) => {
      if (this.exit) {
        reject(new Error('Exit'))
        return
      }

      if (!item.jdkDir || !existsSync(item.jdkDir)) {
        reject(new Error(`JDK not exists: ${item.jdkDir}`))
        return
      }

      if (!item.jarDir || !existsSync(item.jarDir)) {
        reject(new Error(`JAR File not exists: ${item.jarDir}`))
        return
      }

      this.host = item
      await this.stop()
      const javaDir = join(global.Server.BaseDir!, 'java')
      await mkdirp(javaDir)
      const pid = join(javaDir, `${item.id}.pid`)
      const log = join(javaDir, `${item.id}.log`)
      if (existsSync(pid)) {
        await remove(pid)
      }
      const opt = await getHostItemEnv(item)
      const checkpid = async (time = 0) => {
        const pids = await this.checkState()
        console.log('pids: ', pids)
        if (pids.length > 0) {
          this.watch()
          resolve(true)
        } else {
          if (time < 20) {
            await waitTime(1000)
            await checkpid(time + 1)
          } else {
            reject(new Error(I18nT('fork.startFail')))
          }
        }
      }
      const commands: string[] = ['#!/bin/zsh']
      if (opt && opt?.env) {
        for (const k in opt.env) {
          const v = opt.env[k]
          if (v.includes(' ')) {
            commands.push(`export ${k}="${v}"`)
          } else {
            commands.push(`export ${k}=${v}`)
          }
        }
      }
      commands.push(`export PATH="${dirname(item.jdkDir)}:$PATH"`)
      const startCommand = item?.startCommand?.replace(item.jdkDir, 'java')
      commands.push(
        `nohup ${startCommand} --PWSAPPFLAG=${global.Server.BaseDir!} --PWSAPPID=${this.id} &>> ${log} &`
      )
      commands.push(`echo $! > ${pid}`)
      this.command = commands.join('\n')
      console.log('command: ', this.command)
      const sh = join(global.Server.Cache!, `service-${this.id}.sh`)
      await writeFile(sh, this.command)
      await execPromiseRoot([`chmod`, '777', sh])
      try {
        const res = await execPromise(`zsh ${sh}`, opt)
        console.log('start res: ', res)
        await waitTime(1000)
        await checkpid()
      } catch (e) {
        console.log('start e: ', e)
        reject(e)
      }
    })
  }
}
