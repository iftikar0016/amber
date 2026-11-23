import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="ea38785b-ff40-4741-baef-f59f650c6459",
    name="Login and Verify Order Tiles Page",
    tc_id="TC-38",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_amber_demo_greeting": "true", "task_heading_check": "Order tiles"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "usaadt", "session_value": "usaadt", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='3710838e-3374-455e-b961-b1b4b47ce6a4'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for queued login steps to complete', instruction_id='79a9e799-01f0-49bc-8742-3af12311bc6f'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='f599f035-45a0-4ff8-9ec1-23dbdc9bc178'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='9feb7c13-a2f5-4858-b09d-9727f1a8beb8'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='c3797271-77b0-4292-bf7a-e16a4aedd6c1'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='f51d4644-bebc-4aed-9335-6387f1317733'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_amber_demo_greeting', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).textContent.trim() === 'Still at it, Amber Demo?');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Still at it, Amber Demo?"i]'], query='whether a home page greeting for Amber Demo is present in the main content heading', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='9b9cc1e2-fc50-4b47-b1af-96f5db5a7c42'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_amber_demo_greeting}}', 'store_key': 'home_page_amber_demo_greeting', 'variable_refs': {'{{home_page_amber_demo_greeting}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_amber_demo_greeting', 'expected_value': 'true', 'extracted_value': '{{home_page_amber_demo_greeting}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking the search bar in the top bar', instruction_id='3b3b2160-851f-400f-afd4-43f452d442d6'):
        _loc_3 = page.locator("internal:role=button[name=\"Open the search/quick action\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Typing tiles in the top search bar', instruction_id='2d10381b-7623-4108-8acf-5189a72d4233'):
        element_4 = page.locator("internal:role=textbox[name=\"Type a command or search…\"i]")
        
        await testmu.fill(element_4, "tiles")
    
    async with testmu.step('Clicking the Order tiles result in the search results dialog', instruction_id='943131b9-d691-4ac0-96df-04188d92350e'):
        _loc_4 = page.locator("internal:role=button[name=\"Kitchen renovation Order\"i]")
        
        await _loc_4.click()
    _condition_met = False
    _until_retries = 0
    while _until_retries < 10:
        print(f"[until-loop] iteration {_until_retries + 1}/10")
        async with testmu.step('Waiting for the Order tiles page to finish loading', instruction_id='be8212bc-98bd-4b2a-bae2-e9e03f47704d'):
            await page.wait_for_timeout(500)
        await page.wait_for_timeout(500)
        if await testmu.check_until_condition(page, "the heading 'Order tiles' is visible"):
            _condition_met = True
            break
        _until_retries += 1
    set_var("__result__", {"condition_met": _condition_met, "retries": _until_retries + 1})
    
    async with testmu.step('Reading the task heading'):
        set_var('task_heading_check', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {62: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(62).innerText.trim());\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Title"i]'], query='the task heading text at the top of the task page', expected_value='Order tiles', needs_unit_conversion=False, operator='equals', transforms=['strip'], condition='the task heading reads Order tiles'))
    
    async with testmu.step('Assertion check', instruction_id='65252d94-a465-48df-8ae7-17fa827df393'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the task heading reads Order tiles', 'passed': True, 'operator': 'equals', 'transforms': ['strip'], 'json_path': None, 'expected': 'Order tiles', 'extracted_value': '{{task_heading_check}}', 'store_key': 'task_heading_check', 'variable_refs': {'{{task_heading_check}}': 'Order tiles'}}], 'sub_checks': [{'description': 'the task heading reads Order tiles', 'store_key': 'task_heading_check', 'expected_value': 'Order tiles', 'extracted_value': '{{task_heading_check}}', 'operator': 'equals', 'transforms': ['strip']}], 'composite_operator': 'and', 'claim': 'the task heading reads Order tiles'})


if __name__ == "__main__":
    testmu.run(test)