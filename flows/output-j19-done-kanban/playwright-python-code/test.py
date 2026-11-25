import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="21e84446-7d5e-4eae-a29c-90d392ce1bf3",
    name="Complete and Verify Task Status in Kitchen Renovation Project",
    tc_id="TC-76",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_greeting_amber_demo": "true", "choose_worktop_done_column": "true", "choose_worktop_still_done_column": "true", "order_tiles_todo_column": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "qbocbl", "session_value": "qbocbl", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='7fb6f818-a920-41c4-9b39-0a4ac3d6f616'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the login steps to complete', instruction_id='e8bbe4dd-43a5-41df-b53d-bfd49f9d70f4'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='c5d50928-8291-4a59-ba99-c78e07e53be5'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='7a373923-0f79-4a81-80a2-18217c021f25'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='c000f22c-6127-4800-9242-68c5151e86e1'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='2c3fbfef-1e84-45c7-9253-9c46129cc333'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_greeting_amber_demo', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.trim() === 'Fresh start, Amber Demo');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Fresh start, Amber Demo"i]'], query='whether the home page heading greets Amber Demo', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='c79bcb23-29ad-44e3-a325-58da85a4ee86'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'store_key': 'home_page_greeting_amber_demo', 'variable_refs': {'{{home_page_greeting_amber_demo}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_greeting_amber_demo', 'expected_value': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Kitchen renovation in the left project navigation', instruction_id='35833f2c-544b-4060-bf37-3ea523fc419f'):
        _loc_3 = page.locator("internal:label=\"Projects\"i >> internal:role=link[name=\"Kitchen renovation\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Clicking Choose worktop in the task list', instruction_id='652c48d6-f296-4a46-b193-3da764e81d8c'):
        _loc_4 = page.locator("internal:role=link[name=\"Choose worktop\"i]")
        
        await _loc_4.click()
    
    async with testmu.step('Clicking Mark task done button', instruction_id='6ac445ee-03b6-4798-acaa-671d6f5fde97'):
        _loc_5 = page.locator("internal:role=button[name=\"Mark task done!\"i]")
        
        await _loc_5.click()
    
    async with testmu.step('Clicking Kitchen renovation in the worktop breadcrumb', instruction_id='6526bb1d-3e7f-4f5d-a9bf-f3d4115a531d'):
        _loc_6 = page.locator("internal:label=\"Breadcrumb\"i >> internal:text=\"Kitchen renovation\"i")
        
        await _loc_6.click()
    
    async with testmu.step('Clicking Kanban tab for Kitchen renovation project view', instruction_id='4b073f7e-a6fc-46d1-8f80-4f08557f9843'):
        _loc_7 = page.locator("internal:role=link[name=\"Kanban\"i]")
        
        await _loc_7.click()
    
    async with testmu.step('Checking whether Choose worktop is present in the Done column'):
        set_var('choose_worktop_done_column', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {101: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(101).innerText.includes('Done') && !!Array.from(el(101).querySelectorAll('h3, a')).find(e => e.textContent.trim() === 'Choose worktop'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=listitem >> internal:has-text=/^Done #2 Choose worktop$/'], query='whether the Choose worktop task is present in the Done column of the project board', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Choose worktop is in the Done column.'))
    
    async with testmu.step('Assertion check', instruction_id='2b287563-3257-4ab4-8d9f-0a9c5b031436'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'Choose worktop is in the Done column.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{choose_worktop_done_column}}', 'store_key': 'choose_worktop_done_column', 'variable_refs': {'{{choose_worktop_done_column}}': 'true'}}], 'sub_checks': [{'description': 'Choose worktop is in the Done column.', 'store_key': 'choose_worktop_done_column', 'expected_value': 'true', 'extracted_value': '{{choose_worktop_done_column}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'Choose worktop is in the Done column.'})
    
    async with testmu.step('Navigate refresh', instruction_id='4df1ca49-e68b-46ea-847d-2623a59ad812'):
        await page.reload()
    
    async with testmu.step('Reloading the page', instruction_id='d1f93cdd-9e51-4370-aaaf-02fb2a8da67c'):
        await page.wait_for_timeout(500)
    
    async with testmu.step('Checking whether Choose worktop is present in the Done column'):
        set_var('choose_worktop_still_done_column', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {100: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (Array.from(el(100).querySelectorAll('h3')).some(h => h.innerText.trim() === 'Choose worktop'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="Done #2 Choose worktopAdd"i'], query='whether Choose worktop is present in the Done column task list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Choose worktop is still in the Done column.'))
    
    async with testmu.step('Checking whether Order tiles is present in the To-Do column'):
        set_var('order_tiles_todo_column', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {72: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (Array.from(el(72).querySelectorAll('h3')).some(h => h.innerText.trim() === 'Order tiles'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="#4 in 6 daysBook electrician #3 in 2 daysOrder tiles #1 Get three quotes1Add"i'], query='whether Order tiles is present in the To-Do column task list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Order tiles is in the To-Do column.'))
    
    async with testmu.step('Assertion check', instruction_id='4b9a576b-36ad-4937-88fb-282f2a7fdefd'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'Choose worktop is still in the Done column.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{choose_worktop_still_done_column}}', 'store_key': 'choose_worktop_still_done_column', 'variable_refs': {'{{choose_worktop_still_done_column}}': 'true'}}, {'description': 'Order tiles is in the To-Do column.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{order_tiles_todo_column}}', 'store_key': 'order_tiles_todo_column', 'variable_refs': {'{{order_tiles_todo_column}}': 'true'}}], 'sub_checks': [{'description': 'Choose worktop is still in the Done column.', 'store_key': 'choose_worktop_still_done_column', 'expected_value': 'true', 'extracted_value': '{{choose_worktop_still_done_column}}', 'operator': 'equals', 'transforms': []}, {'description': 'Order tiles is in the To-Do column.', 'store_key': 'order_tiles_todo_column', 'expected_value': 'true', 'extracted_value': '{{order_tiles_todo_column}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'Choose worktop is still in the Done column and Order tiles is in the To-Do column.'})


if __name__ == "__main__":
    testmu.run(test)