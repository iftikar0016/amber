import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="e3f5e86e-42a7-400b-9878-3d186fd021a0",
    name="Verify Analytics Task Setup",
    tc_id="TC-34",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_greeting_amber_demo": "true", "task_heading_check": "Set up analytics", "description_privacy_friendly_tool_check": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "jseodg", "session_value": "jseodg", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='3bd7c7b2-3a9e-4612-b542-dc4cd10f5b37'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the queued login steps to run', instruction_id='60ce2639-9604-4d03-a601-05ea284208fb'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='6bdf6563-42aa-419a-9fdb-c538e27e2544'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='6aa6cf32-9507-4902-9b36-6cea635b5259'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='d5c3c20e-ffc7-4c6e-abf0-5d94a623745d'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='7f643812-011e-44e6-9c3f-f6a9b5dc66da'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_greeting_amber_demo', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.trim().includes('Amber Demo'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Still at it, Amber Demo?"i]'], query='whether the home page greeting heading in the main content contains Amber Demo', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='b81c6d36-2061-4adb-aa29-5fc41e0d6d6d'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'store_key': 'home_page_greeting_amber_demo', 'variable_refs': {'{{home_page_greeting_amber_demo}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_greeting_amber_demo', 'expected_value': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Website relaunch in the project list navigation', instruction_id='bc416ac6-d2fe-4618-8ed5-a7d24969fb89'):
        _loc_3 = page.locator("internal:label=\"Projects\"i >> internal:role=link[name=\"Website relaunch\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Clicking Set up analytics in the website relaunch task list', instruction_id='b56ce3bb-3c19-419d-a5c5-bd0744e7872d'):
        _loc_4 = page.locator("internal:role=link[name=\"Set up analytics\"i]")
        
        await _loc_4.click()
    
    async with testmu.step('Reading the task heading'):
        set_var('task_heading_check', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {63: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(63).innerText);\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Title"i]'], query='the task title text in the page heading', expected_value='Set up analytics', needs_unit_conversion=False, operator='equals', transforms=['strip'], condition='the task heading reads Set up analytics'))
    
    async with testmu.step('Checking for a privacy-friendly tool in the description'):
        set_var('description_privacy_friendly_tool_check', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {69: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(69).innerText.includes('privacy-friendly tool'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="Use a privacy-friendly tool."i'], query='whether a privacy-friendly tool is mentioned in the task description', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the description mentions a privacy-friendly tool'))
    
    async with testmu.step('Assertion check', instruction_id='ae72206e-86d4-4125-b5ad-312ba1184d3d'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the task heading reads Set up analytics', 'passed': True, 'operator': 'equals', 'transforms': ['strip'], 'json_path': None, 'expected': 'Set up analytics', 'extracted_value': '{{task_heading_check}}', 'store_key': 'task_heading_check', 'variable_refs': {'{{task_heading_check}}': 'Set up analytics'}}, {'description': 'the description mentions a privacy-friendly tool', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{description_privacy_friendly_tool_check}}', 'store_key': 'description_privacy_friendly_tool_check', 'variable_refs': {'{{description_privacy_friendly_tool_check}}': 'true'}}], 'sub_checks': [{'description': 'the task heading reads Set up analytics', 'store_key': 'task_heading_check', 'expected_value': 'Set up analytics', 'extracted_value': '{{task_heading_check}}', 'operator': 'equals', 'transforms': ['strip']}, {'description': 'the description mentions a privacy-friendly tool', 'store_key': 'description_privacy_friendly_tool_check', 'expected_value': 'true', 'extracted_value': '{{description_privacy_friendly_tool_check}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the task heading reads Set up analytics and the description mentions a privacy-friendly tool'})


if __name__ == "__main__":
    testmu.run(test)