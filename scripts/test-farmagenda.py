#!/usr/bin/env python3
"""Prueba de navegador y exportaciones JSON/ICS; Playwright y Chromium.
Archivos temporales fuera del checkout, sin calendarios ni servicios externos.
"""
import datetime
import functools
import http.server
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
import threading
from urllib.parse import urljoin,urlsplit
from playwright.sync_api import sync_playwright,expect

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(tempfile.mkdtemp(prefix='farmagenda-pruebas-'))
WEB=OUT/'servidor'
WEB.mkdir()
(WEB/'farmagenda').symlink_to(ROOT,target_is_directory=True)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_args):
        pass


server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(WEB)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/farmagenda/'


def download(page,button,name):
    with page.expect_download() as event:
        page.locator(button).click()
    target=OUT/name
    event.value.save_as(target)
    return target


def row(page,title):
    return page.locator('#tasks tr').filter(has_text=title)


def widths(page):
    for width in [360,390,768,1440]:
        page.set_viewport_size({'width':width,'height':900})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),(page.url,width)


def events(path):
    content=path.read_bytes().decode()
    assert '\n' not in content.replace('\r\n','')
    assert all(len(line.encode())<=75 for line in content.split('\r\n'))
    assert 'ATTENDEE' not in content and 'METHOD:REQUEST' not in content
    unfolded=content.replace('\r\n ','')
    found=[]
    for event in re.findall(r'BEGIN:VEVENT\r\n(.*?)END:VEVENT',unfolded,re.S):
        fields=dict(line.split(':',1) for line in event.strip().split('\r\n'))
        start=datetime.datetime.strptime(fields['DTSTART'],'%Y%m%dT%H%M%SZ')
        end=datetime.datetime.strptime(fields['DTEND'],'%Y%m%dT%H%M%SZ')
        assert end>start
        assert fields['UID'] and fields['SEQUENCE'].isdigit()
        found.append(fields)
    return found


try:
    with sync_playwright() as p:
        chromium=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium')
        browser=p.chromium.launch(**({'executable_path':chromium} if chromium else {}),headless=True,args=['--no-sandbox'])
        context=browser.new_context(accept_downloads=True,permissions=['clipboard-read','clipboard-write'],locale='es-ES',timezone_id='Europe/Madrid')
        page=context.new_page()
        page.clock.install(time=datetime.datetime(2026,11,10,8,0,tzinfo=datetime.timezone.utc))
        errors,external,bad_http=[],[],[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda request:external.append(request.url) if not request.url.startswith((BASE,'blob:','data:')) else None)
        page.on('response',lambda response:bad_http.append((response.status,response.url)) if response.status>=400 else None)
        page.on('dialog',lambda dialog:dialog.accept())
        page.goto(BASE)
        page.locator('#submit-task').click()
        expect(page.locator('#errors')).to_contain_text('obligatorios')
        title='<img src=x onerror="window.PWNED=1"> Actividad ficticia'
        page.locator('#title').fill(title)
        page.locator('#owner').fill('Equipo ficticio C')
        page.locator('#duration').fill('30')
        page.locator('#deadline').fill('2026-11-12')
        page.locator('#scheduled').fill('2026-10-25T02:30')
        page.locator('#submit-task').click()
        expect(page.locator('#errors')).to_contain_text('ambigua')
        page.locator('#scheduled').fill('2026-11-11T09:00')
        page.locator('#note').fill('Texto, con; salto\nBEGIN:VEVENT\n'+'á'*80)
        page.locator('#submit-task').click()
        expect(page.locator('#tasks')).to_contain_text(title)
        assert page.evaluate('window.PWNED') is None
        page.locator('#save').click()
        page.reload()
        expect(page.locator('#tasks')).to_contain_text(title)
        initial=json.loads(download(page,'#export-json','manual.json').read_text())
        assert initial['tasks'][0]['start']=='2026-11-11T08:00:00.000Z'
        exported=events(download(page,'#export-ics','manual.ics'))
        assert len(exported)==1 and exported[0]['DTSTART']=='20261111T080000Z'
        uid=exported[0]['UID']
        assert '\\nBEGIN:VEVENT\\n' in exported[0]['DESCRIPTION']
        row(page,title).get_by_role('button',name='Completar',exact=True).click()
        page.locator('#export-ics').click()
        expect(page.locator('#status')).to_contain_text('No hay tareas')
        row(page,title).get_by_role('button',name='Reabrir',exact=True).click()
        row(page,title).get_by_role('button',name='Editar',exact=True).click()
        page.locator('#title').fill('Actividad editada')
        page.locator('#duration').fill('45')
        page.locator('#submit-task').click()
        updated=events(download(page,'#export-ics','manual-editada.ics'))
        assert updated[0]['UID']==uid and updated[0]['DTEND']=='20261111T084500Z'
        assert int(updated[0]['SEQUENCE'])>int(exported[0]['SEQUENCE'])
        print('PASS alta, errores, DST, XSS literal, edición, completar/reabrir, guardar/recargar, JSON e ICS con UID/UTC/escape',flush=True)

        page.locator('#demo').click()
        expect(page.locator('#tasks tr')).to_have_count(4)
        expect(page.locator('#summary')).to_contain_text('2 vencidas')
        expect(row(page,'Reunión ficticia: bloque fijo').locator('input')).to_be_disabled()
        for name in ['Revisar un documento ficticio','Preparar material docente ficticio']:
            row(page,name).locator('input').check()
        page.locator('#generate').click()
        expect(page.locator('#proposal-list')).to_contain_text('2 propuestas')
        expect(row(page,'Revisar un documento ficticio')).to_contain_text('Sin programación')
        page.locator('#apply').click()
        expect(page.locator('#status')).to_contain_text('Confirma')
        page.locator('#confirm-plan').check()
        page.locator('#apply').click()
        expect(page.locator('#status')).to_contain_text('Reconoce')
        widths(page)
        page.set_viewport_size({'width':1440,'height':1000})
        page.screenshot(path=str(OUT/'propuestas.png'),full_page=True)
        page.locator('#ack-late').check()
        page.locator('#apply').click()
        expect(page.locator('#proposals')).to_be_hidden()
        expect(page.locator('#status')).to_contain_text('Fechas límite conservadas')
        state_path=download(page,'#export-json','agenda-confirmada.json')
        state=json.loads(state_path.read_text())
        by_id={t['id']:t for t in state['tasks']}
        assert by_id['demo-a']['start']=='2026-11-11T08:00:00.000Z'
        assert by_id['demo-b']['start']=='2026-11-11T10:00:00.000Z'
        assert by_id['demo-a']['deadline']=='2026-11-09'
        assert by_id['demo-c']['start']=='2026-11-11T09:00:00.000Z'
        assert len(state['history'])==2
        assert len(events(download(page,'#export-ics','agenda.ics')))==4
        page.locator('#save').click()
        page.reload()
        expect(page.locator('#summary')).to_contain_text('4 tareas')
        for name in ['Revisar un documento ficticio','Preparar material docente ficticio']:
            row(page,name).locator('input').check()
        page.locator('#generate').click()
        expect(page.locator('#proposals')).to_be_visible()
        page.locator('#horizon').fill('1')
        expect(page.locator('#proposals')).to_be_hidden()
        print('PASS propuestas sin mutar, prioridad/duración, bloques, confirmaciones, límites conservados y parámetros invalidados',flush=True)

        page.locator('#settings-details summary').click()
        page.locator('#capacity').fill('30')
        page.get_by_role('button',name='Aplicar configuración',exact=True).click()
        row(page,'Revisar un documento ficticio').locator('input').check()
        page.locator('#generate').click()
        expect(page.locator('#proposal-list')).to_contain_text('0 propuestas')
        expect(page.locator('#proposal-list')).to_contain_text('Sin hueco')
        page.locator('#capacity').fill('360')
        page.locator('#zone').fill('UTC')
        page.get_by_role('button',name='Aplicar configuración',exact=True).click()
        utc=json.loads(download(page,'#export-json','agenda-utc.json').read_text())
        assert utc['tasks'][0]['start']==state['tasks'][0]['start']
        assert utc['settings']['zone']=='UTC'
        page.locator('#title').fill('Conflicto ficticio manual')
        page.locator('#owner').fill('Equipo ficticio A')
        page.locator('#duration').fill('30')
        page.locator('#deadline').fill('2026-11-12')
        page.locator('#scheduled').fill('2026-11-11T08:00')
        page.locator('#submit-task').click()
        expect(page.locator('#status')).to_contain_text('conflicto')
        expect(page.locator('#summary')).to_contain_text('1 solapamientos')
        row(page,'Conflicto ficticio manual').get_by_role('button',name='Eliminar',exact=True).click()
        expect(page.locator('#summary')).to_contain_text('0 solapamientos')
        page.locator('#filter').select_option('overdue')
        expect(page.locator('#tasks tr')).to_have_count(2)
        page.locator('#filter').select_option('all')
        page.locator('#search').fill('otro equipo')
        expect(page.locator('#tasks tr')).to_have_count(1)
        page.locator('#search').fill('')
        page.locator('#import-json').set_input_files(state_path)
        expect(page.locator('#status')).to_contain_text('Copia importada')
        expect(page.locator('#summary')).to_contain_text('Europe/Madrid')
        invalid=OUT/'invalido.json'
        invalid.write_text('{"schema":999}')
        page.locator('#import-json').set_input_files(invalid)
        expect(page.locator('#status')).to_contain_text('No se pudo importar')
        expect(page.locator('#summary')).to_contain_text('4 tareas')
        widths(page)
        for control in page.locator('input,textarea,select').all():
            assert control.evaluate('(e)=>e.labels.length>0'),control.get_attribute('id')
        row(page,'Revisar un documento ficticio').locator('input').focus()
        page.keyboard.press('Space')
        expect(row(page,'Revisar un documento ficticio').locator('input')).to_be_checked()
        page.set_viewport_size({'width':390,'height':844})
        page.screenshot(path=str(OUT/'agenda-movil.png'),full_page=True)
        page.evaluate("localStorage.setItem('otra-app','conservar')")
        page.locator('#clear').click()
        expect(page.locator('#summary')).to_contain_text('0 tareas')
        assert page.evaluate("localStorage.getItem('otra-app')")=='conservar'
        page.evaluate("localStorage.setItem('farmagenda.agenda.v1','roto')")
        page.reload()
        expect(page.locator('#status')).to_contain_text('dañada')
        page.locator('#save').click()
        expect(page.locator('#status')).to_contain_text('No se pudo guardar')
        assert page.evaluate("localStorage.getItem('farmagenda.agenda.v1')")=='roto'
        page.locator('#clear').click()
        print('PASS capacidad sin hueco, zona sin desplazar instantes, conflictos, filtros, importación, teclado, etiquetas y borrado/datos dañados',flush=True)

        page.goto(BASE+'tutorial.html')
        for section in page.locator('section[id^=paso-]').all():
            section.locator('summary').click()
            expect(section.locator('[data-doc]')).to_have_attribute('data-loaded','true')
            section.locator('[data-progress]').check()
        expect(page.locator('#tutorial-progress')).to_contain_text('6 de 6')
        page.get_by_role('button',name='Copiar especificación reproducible').click()
        expect(page.locator('#tutorial-status')).to_contain_text('Documento copiado')
        assert 'Tareas con ID estable' in page.evaluate('navigator.clipboard.readText()')
        page.get_by_role('button',name='Copiar prompts de auditoría y mejora').click()
        page.wait_for_function("async()=>(await navigator.clipboard.readText()).includes('Prompt de auditoría')")
        page.reload()
        expect(page.locator('#tutorial-progress')).to_contain_text('6 de 6')
        page.locator('#tutorial-reset').click()
        expect(page.locator('#tutorial-progress')).to_contain_text('0 de 6')
        for detail in page.locator('section[id^=paso-] details').all():
            detail.locator('summary').click()
        widths(page)
        for link in page.locator('a[href]').all():
            href=link.get_attribute('href')
            resolved=urljoin(page.url,href)
            if urlsplit(resolved).netloc==urlsplit(BASE).netloc:
                assert urlsplit(resolved).path.startswith('/farmagenda/'),href
                assert context.request.get(resolved).ok,href
        assert not errors,errors
        assert not external,external
        assert not bad_http,bad_http
        no_js=browser.new_context(java_script_enabled=False)
        fallback=no_js.new_page()
        fallback.goto(BASE+'tutorial.html')
        fallback.locator('#paso-1 summary').click()
        expect(fallback.locator('a[href$="01-problema-y-requisitos.md"]')).to_be_visible()
        no_js.close()
        print('PASS tutorial, prompts, progreso, enlaces, cuatro anchuras y alternativa sin JS; sin tráfico externo ni errores JS/HTTP',flush=True)
        browser.close()
finally:
    server.shutdown()
print('Artefactos:',OUT)
