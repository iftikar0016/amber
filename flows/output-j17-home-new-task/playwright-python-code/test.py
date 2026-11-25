import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="c92f887f-b5f8-41fb-a904-3a18675a8c6c",
    name="Add and Verify Task Persistence",
    tc_id="TC-71",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_amber_demo_greeting": "true", "call_plumber_current_tasks_listing": "true", "call_plumber_persisted_current_tasks_listing": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "pfoluj", "session_value": "pfoluj", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='fe309f3f-4bae-4404-9aad-42a676a840b2'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the login steps to complete', instruction_id='752ba01e-d8d5-4e7c-b67b-84929859ac87'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='b5b0ea4c-7699-47da-854a-59d01047d813'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='526a80a8-88aa-4097-a125-b17d05c98663'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='0f845c7f-0b4c-4cdf-9eb3-2b94a6b10a25'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='007123ac-247d-48a3-a592-f3699a7f40e6'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    _condition_met = False
    _until_retries = 0
    while _until_retries < 10:
        print(f"[until-loop] iteration {_until_retries + 1}/10")
        async with testmu.step('Waiting for the home page greeting to appear', instruction_id='8f8210a0-5cdd-4f47-bb2c-4f61b7fe36eb'):
            await page.wait_for_timeout(500)
        await page.wait_for_timeout(500)
        if await testmu.check_until_condition(page, 'the heading "Fresh start, Amber Demo" is visible'):
            _condition_met = True
            break
        _until_retries += 1
    set_var("__result__", {"condition_met": _condition_met, "retries": _until_retries + 1})
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_amber_demo_greeting', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.trim() === 'Fresh start, Amber Demo');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Fresh start, Amber Demo"i]'], query='whether the home page greeting for Amber Demo is present in the main heading', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='2fdfa060-4524-4b03-83e4-288c56ff0b99'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_amber_demo_greeting}}', 'store_key': 'home_page_amber_demo_greeting', 'variable_refs': {'{{home_page_amber_demo_greeting}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_amber_demo_greeting', 'expected_value': 'true', 'extracted_value': '{{home_page_amber_demo_greeting}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Kitchen renovation in the Projects navigation menu', instruction_id='165de9ea-894a-40de-b697-bcc8ca9592d5'):
        _loc_3 = page.locator("internal:label=\"Projects\"i >> internal:role=link[name=\"Kitchen renovation\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Waiting for the plan steps to complete', instruction_id='b2af0171-f84d-4424-a8d4-6ccfe1fd25a5'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "Call plumber {{global.amber_tag}}" into "Add a task…"', instruction_id='8cb46e8d-4cbb-4447-a319-23e332eb202f'):
        element_4 = page.locator("internal:role=textbox[name=\"Add a task…\"i]")
        variable_value_5 = var('Call plumber {{global.amber_tag}}')
        
        await testmu.fill(element_4, variable_value_5)
    
    async with testmu.step('Click "Add"', instruction_id='0504a44c-f7ae-4c22-86ec-10c4d9a9773f'):
        _loc_4 = page.locator("internal:role=button[name=\"Add\"s]")
        
        await _loc_4.click()
    
    async with testmu.step('Clicking Overview in the main navigation menu', instruction_id='d2797533-b231-461c-9bf7-dba844fd061b'):
        _loc_5 = page.locator("internal:role=link[name=\"Overview\"i]")
        
        await _loc_5.click()
    
    async with testmu.step('Checking whether the Call plumber task is listed under Current Tasks'):
        set_var('call_plumber_current_tasks_listing', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {76: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (Array.from(el(76).querySelectorAll('a'), a => a.textContent.trim()).includes('Call plumber {{global.amber_tag}}'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=list >> internal:has-text="CheckboxKitchen"i'], query='whether the Call plumber {{global.amber_tag}} task is listed in the Current Tasks list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Call plumber {{global.amber_tag}} is listed under Current Tasks.', variables={'global.amber_tag': var('{{global.amber_tag}}')}, reprobe=True))
    
    async with testmu.step('Assertion check', instruction_id='2ffc20c7-fe0b-4d3a-b4a4-8c37ae698d52'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'Call plumber {{global.amber_tag}} is listed under Current Tasks.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{call_plumber_current_tasks_listing}}', 'store_key': 'call_plumber_current_tasks_listing', 'variable_refs': {'{{call_plumber_current_tasks_listing}}': 'true', '{{global.amber_tag}}': 'pfoluj'}}], 'sub_checks': [{'description': 'Call plumber {{global.amber_tag}} is listed under Current Tasks.', 'store_key': 'call_plumber_current_tasks_listing', 'expected_value': 'true', 'extracted_value': '{{call_plumber_current_tasks_listing}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'Call plumber {{global.amber_tag}} is listed under Current Tasks.'})
    
    async with testmu.step('Navigate refresh', instruction_id='5315def8-90d5-459e-9402-45700dd5264c'):
        await page.reload()
    
    async with testmu.step('Checking whether the Call plumber task is present in Current Tasks'):
        set_var('call_plumber_persisted_current_tasks_listing', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {76: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (Array.from(el(76).querySelectorAll('a'), a => a.textContent.trim()).includes('Call plumber {{global.amber_tag}}'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=list >> internal:has-text="CheckboxKitchen"i'], query='whether the Call plumber {{global.amber_tag}} task is listed in the Current Tasks list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Call plumber {{global.amber_tag}} is still listed under Current Tasks.', variables={'global.amber_tag': var('{{global.amber_tag}}')}, reprobe=True))
    
    async with testmu.step('Assertion check', instruction_id='e17a05b1-0d44-414c-9191-90e7c9eb2ed4'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'Call plumber {{global.amber_tag}} is still listed under Current Tasks.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{call_plumber_persisted_current_tasks_listing}}', 'store_key': 'call_plumber_persisted_current_tasks_listing', 'variable_refs': {'{{call_plumber_persisted_current_tasks_listing}}': 'true', '{{global.amber_tag}}': 'pfoluj'}}], 'sub_checks': [{'description': 'Call plumber {{global.amber_tag}} is still listed under Current Tasks.', 'store_key': 'call_plumber_persisted_current_tasks_listing', 'expected_value': 'true', 'extracted_value': '{{call_plumber_persisted_current_tasks_listing}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'Call plumber {{global.amber_tag}} is still listed under Current Tasks.'})


if __name__ == "__main__":
    testmu.run(test)