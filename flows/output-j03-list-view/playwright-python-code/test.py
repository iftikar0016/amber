import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="20dabdec-11b9-4a6c-860f-11d1c8639e30",
    name="Verify Project Task List After Login",
    tc_id="TC-30",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_greeting_amber_demo": "true", "write_homepage_copy_task": "true", "set_up_analytics_task": "true", "launch_checklist_task": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "yezakt", "session_value": "yezakt", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='8b68aa8a-c1a8-4b54-8fb8-258f0f152ab3'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the login form to load', instruction_id='f4634005-2c01-4cb7-a181-dcd06bfa2565'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='bd56bcd7-a96a-4a62-92de-80c1be803065'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='336ec975-8eb4-4d94-bbe1-e6149a466154'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='ccfab22d-6725-43a9-ac8c-2a06a903cf39'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='2c26ac05-2143-439f-935f-1b2d3bfabcba'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    _condition_met = False
    _until_retries = 0
    while _until_retries < 10:
        print(f"[until-loop] iteration {_until_retries + 1}/10")
        async with testmu.step('Waiting for the home page greeting after signing in', instruction_id='7a85e5cd-20b9-44f8-b1a5-65466f08ed5f'):
            await page.wait_for_timeout(500)
        await page.wait_for_timeout(500)
        if await testmu.check_until_condition(page, "the heading 'Still at it, Amber Demo?' is visible"):
            _condition_met = True
            break
        _until_retries += 1
    set_var("__result__", {"condition_met": _condition_met, "retries": _until_retries + 1})
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_greeting_amber_demo', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.includes('Amber Demo'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Still at it, Amber Demo?"i]'], query='whether the home page greeting heading in the main content includes Amber Demo', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='a31d29e4-c643-42ee-9e16-a0601b3e48ea'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'store_key': 'home_page_greeting_amber_demo', 'variable_refs': {'{{home_page_greeting_amber_demo}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_greeting_amber_demo', 'expected_value': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Website relaunch link in Projects navigation sidebar', instruction_id='3186adae-8aba-40b9-b508-7979b835a341'):
        _loc_3 = page.locator("internal:label=\"Projects\"i >> internal:role=link[name=\"Website relaunch\"i]")
        
        await _loc_3.click()
    _condition_met = False
    _until_retries = 0
    while _until_retries < 10:
        print(f"[until-loop] iteration {_until_retries + 1}/10")
        async with testmu.step('Waiting for the project task list to load', instruction_id='093d7e15-99de-49cd-b89c-c31480fa2a07'):
            await page.wait_for_timeout(500)
        await page.wait_for_timeout(500)
        if await testmu.check_until_condition(page, "the text 'Write homepage copy' is visible"):
            _condition_met = True
            break
        _until_retries += 1
    set_var("__result__", {"condition_met": _condition_met, "retries": _until_retries + 1})
    
    async with testmu.step('Checking whether the Write homepage copy task is present'):
        set_var('write_homepage_copy_task', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {107: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(107).innerText.trim() === 'Write homepage copy');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=link[name="Write homepage copy"i]'], query='whether the Write homepage copy task link is present in the task list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the task list shows Write homepage copy'))
    
    async with testmu.step('Checking whether the Set up analytics task is present'):
        set_var('set_up_analytics_task', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {95: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(95).innerText.trim() === 'Set up analytics');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=link[name="Set up analytics"i]'], query='whether the Set up analytics task link is present in the task list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the task list shows Set up analytics'))
    
    async with testmu.step('Checking whether the Launch checklist task is present'):
        set_var('launch_checklist_task', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {80: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(80).innerText.trim() === 'Launch checklist');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=link[name="Launch checklist"i]'], query='whether the Launch checklist task link is present in the task list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the task list shows Launch checklist'))
    
    async with testmu.step('Assertion check', instruction_id='66491fed-b35a-4ec2-86b1-f4a95fd6a7b0'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the task list shows Write homepage copy', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{write_homepage_copy_task}}', 'store_key': 'write_homepage_copy_task', 'variable_refs': {'{{write_homepage_copy_task}}': 'true'}}, {'description': 'the task list shows Set up analytics', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{set_up_analytics_task}}', 'store_key': 'set_up_analytics_task', 'variable_refs': {'{{set_up_analytics_task}}': 'true'}}, {'description': 'the task list shows Launch checklist', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{launch_checklist_task}}', 'store_key': 'launch_checklist_task', 'variable_refs': {'{{launch_checklist_task}}': 'true'}}], 'sub_checks': [{'description': 'the task list shows Write homepage copy', 'store_key': 'write_homepage_copy_task', 'expected_value': 'true', 'extracted_value': '{{write_homepage_copy_task}}', 'operator': 'equals', 'transforms': []}, {'description': 'the task list shows Set up analytics', 'store_key': 'set_up_analytics_task', 'expected_value': 'true', 'extracted_value': '{{set_up_analytics_task}}', 'operator': 'equals', 'transforms': []}, {'description': 'the task list shows Launch checklist', 'store_key': 'launch_checklist_task', 'expected_value': 'true', 'extracted_value': '{{launch_checklist_task}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'its task list shows Write homepage copy, Set up analytics and Launch checklist'})


if __name__ == "__main__":
    testmu.run(test)