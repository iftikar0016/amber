import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="76b8eb5c-77cd-41dc-94be-b8045d182911",
    name="Verify Upcoming Tasks After Login",
    tc_id="TC-37",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_greeting_amber_demo": "true", "order_tiles_listed": "true", "review_pricing_page_listed": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "davoef", "session_value": "davoef", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='cbb92507-4247-4d66-92b9-1a0961e65b40'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the queued login steps to complete', instruction_id='e46a870f-a4b1-421f-b232-713ce3d435b3'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='cccc51a2-b641-40f0-bfd2-b62700df8011'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='3469ae74-9d93-4e12-8cc4-7eba2a6644cd'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='2ff1dce1-ebf1-48ea-b7a5-b5e31c100770'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='15db2dc5-26d0-4d6a-a4fa-6eba4be8dc80'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_greeting_amber_demo', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.includes('Amber Demo'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Still at it, Amber Demo?"i]'], query='whether a greeting to Amber Demo is present in the home page main heading', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='42473901-a3cf-4f64-93e1-4720d0016955'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'store_key': 'home_page_greeting_amber_demo', 'variable_refs': {'{{home_page_greeting_amber_demo}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_greeting_amber_demo', 'expected_value': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Upcoming in the main menu', instruction_id='0ee32d4a-a75a-48df-8d52-dee34e65c1ce'):
        _loc_3 = page.locator("internal:role=link[name=\"Upcoming\"i]")
        
        await _loc_3.click()
    _condition_met = False
    _until_retries = 0
    while _until_retries < 10:
        print(f"[until-loop] iteration {_until_retries + 1}/10")
        async with testmu.step('Waiting for the Upcoming tasks page to finish loading', instruction_id='5e803035-52b1-48f8-9632-999031e9875a'):
            await page.wait_for_timeout(500)
        await page.wait_for_timeout(500)
        if await testmu.check_until_condition(page, "the heading 'Tasks from November 23, 2026 until November 30, 2026' is visible"):
            _condition_met = True
            break
        _until_retries += 1
    set_var("__result__", {"condition_met": _condition_met, "retries": _until_retries + 1})
    
    async with testmu.step('Checking whether the Order tiles task is listed'):
        set_var('order_tiles_listed', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {77: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(77).textContent.trim() === 'Order tiles');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=link[name="Order tiles"i]'], query='whether the Order tiles task link is present in the upcoming tasks list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the task Order tiles is listed'))
    
    async with testmu.step('Checking whether the Review pricing page task is listed'):
        set_var('review_pricing_page_listed', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {88: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(88).textContent.trim() === 'Review pricing page');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=link[name="Review pricing page"i]'], query='whether the Review pricing page task link is present in the upcoming tasks list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the task Review pricing page is listed'))
    
    async with testmu.step('Assertion check', instruction_id='f7647213-a284-4a1d-a067-f9449ed9a10c'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the task Order tiles is listed', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{order_tiles_listed}}', 'store_key': 'order_tiles_listed', 'variable_refs': {'{{order_tiles_listed}}': 'true'}}, {'description': 'the task Review pricing page is listed', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{review_pricing_page_listed}}', 'store_key': 'review_pricing_page_listed', 'variable_refs': {'{{review_pricing_page_listed}}': 'true'}}], 'sub_checks': [{'description': 'the task Order tiles is listed', 'store_key': 'order_tiles_listed', 'expected_value': 'true', 'extracted_value': '{{order_tiles_listed}}', 'operator': 'equals', 'transforms': []}, {'description': 'the task Review pricing page is listed', 'store_key': 'review_pricing_page_listed', 'expected_value': 'true', 'extracted_value': '{{review_pricing_page_listed}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the tasks Order tiles and Review pricing page are listed'})


if __name__ == "__main__":
    testmu.run(test)