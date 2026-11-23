import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="effe0dfc-3890-40b2-a4d6-52ee18d82f3f",
    name="User Login and Homepage Verification",
    tc_id="TC-32",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_greeting_amber_demo": "true", "order_tiles_current_tasks": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "udlmqy", "session_value": "udlmqy", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='ac5f74dc-e65d-416b-9df5-b3fd75fef806'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the queued plan to complete', instruction_id='094e8984-e2dd-49e0-9858-9a2594f0ad4e'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='9eb7dd53-3b7b-4b38-a8f7-372fe6d477d1'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='6fd301ce-fc63-4647-b14d-109405748533'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='2c58ce63-c50e-4ccf-b371-69dcdff352f2'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='a8501153-b22a-494f-b82b-00d443abea98'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Waiting for the signed-in home page to fully load and settle', instruction_id='53bcebc5-9d0f-4ca1-9de5-00997a609c16'):
        await page.wait_for_timeout(500)
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_greeting_amber_demo', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.trim() === 'Still at it, Amber Demo?');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Still at it, Amber Demo?"i]'], query='whether the greeting for Amber Demo is present in the main content heading', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Checking whether the Order tiles task is present'):
        set_var('order_tiles_current_tasks', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {76: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(76).innerText.trim() === 'Order tiles');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=link[name="Order tiles"i]'], query='whether the Order tiles task is present in the Current Tasks list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page lists the task Order tiles among the current tasks'))
    
    async with testmu.step('Assertion check', instruction_id='9fc6297c-350d-4dee-aed1-81ebd29c433e'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'store_key': 'home_page_greeting_amber_demo', 'variable_refs': {'{{home_page_greeting_amber_demo}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_greeting_amber_demo', 'expected_value': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Assertion check', instruction_id='151f2989-e883-450e-8792-b838320c454d'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page lists the task Order tiles among the current tasks', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{order_tiles_current_tasks}}', 'store_key': 'order_tiles_current_tasks', 'variable_refs': {'{{order_tiles_current_tasks}}': 'true'}}], 'sub_checks': [{'description': 'the home page lists the task Order tiles among the current tasks', 'store_key': 'order_tiles_current_tasks', 'expected_value': 'true', 'extracted_value': '{{order_tiles_current_tasks}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page lists the task Order tiles among the current tasks'})


if __name__ == "__main__":
    testmu.run(test)