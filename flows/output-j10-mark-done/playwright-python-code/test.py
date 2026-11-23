import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="71bbbbde-2a08-48b2-8542-3bb2861fd38c",
    name="Complete and Verify Task Completion in Project",
    tc_id="TC-39",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_greeting_amber_demo": "true", "choose_worktop_open_tasks": "false", "order_tiles_open_tasks": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "cijtvj", "session_value": "cijtvj", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='d430ae14-370d-418f-a4c5-d3f656059f4c'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for queued login steps to complete', instruction_id='baf0dcf7-ddef-4984-89df-060dcb2ae9e4'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='fcc9e75d-95a1-4aa4-86fb-05ddfa2ed712'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='87605035-536f-4149-972c-f74a6c1cd673'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='686631be-b70c-4de8-9e8b-2ab9934fbdfc'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='517c50a8-0aec-4c9d-9e65-4f20696f2cd6'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_greeting_amber_demo', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).textContent.trim().includes('Amber Demo'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Still at it, Amber Demo?"i]'], query='whether a greeting to Amber Demo in the home page main heading is present', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='17cd8539-7cb5-41e1-a0de-2cb9599772bf'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'store_key': 'home_page_greeting_amber_demo', 'variable_refs': {'{{home_page_greeting_amber_demo}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_greeting_amber_demo', 'expected_value': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Kitchen renovation in Projects navigation', instruction_id='921c1bef-446b-467b-9e8f-b6674ba780fb'):
        _loc_3 = page.locator("internal:label=\"Projects\"i >> internal:role=link[name=\"Kitchen renovation\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Clicking the Choose worktop checkbox to mark the task as done', instruction_id='01945a79-76e5-45db-9e84-c968325af1b6'):
        _loc_4 = page.locator("internal:role=checkbox[name=\"Mark 'Choose worktop' as done\"i]")
        
        await _loc_4.click()
    
    async with testmu.step('Navigate refresh', instruction_id='e8df4eb8-a217-44b4-8611-90545ec06d77'):
        await page.reload()
    
    async with testmu.step('whether Choose worktop is present in the list of open tasks', instruction_id='3cc46b56-fb46-4a2e-8cdf-f7a4c9404f7e'):
        set_var('choose_worktop_open_tasks', await testmu.vision_query(page, "whether Choose worktop is present in the list of open tasks", ""))
    
    async with testmu.step('whether Order tiles is present in the list of open tasks', instruction_id='ecdb1a35-93c9-4e37-baf7-ba896a842652'):
        set_var('order_tiles_open_tasks', await testmu.vision_query(page, "whether Order tiles is present in the list of open tasks", ""))
    
    async with testmu.step('Assertion check', instruction_id='84e0f1c6-fead-4dfb-8451-2aaa524ad8f6'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'Choose worktop is no longer in the list of open tasks', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'false', 'extracted_value': '{{choose_worktop_open_tasks}}', 'store_key': 'choose_worktop_open_tasks', 'variable_refs': {'{{choose_worktop_open_tasks}}': 'false'}}, {'description': 'Order tiles still is in the list of open tasks', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{order_tiles_open_tasks}}', 'store_key': 'order_tiles_open_tasks', 'variable_refs': {'{{order_tiles_open_tasks}}': 'true'}}], 'sub_checks': [{'description': 'Choose worktop is no longer in the list of open tasks', 'store_key': 'choose_worktop_open_tasks', 'expected_value': 'false', 'extracted_value': '{{choose_worktop_open_tasks}}', 'operator': 'equals', 'transforms': []}, {'description': 'Order tiles still is in the list of open tasks', 'store_key': 'order_tiles_open_tasks', 'expected_value': 'true', 'extracted_value': '{{order_tiles_open_tasks}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'Choose worktop is no longer in the list of open tasks and Order tiles still is'})


if __name__ == "__main__":
    testmu.run(test)