import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="eccdfece-7ff4-42d5-bce3-7dec49d5774a",
    name="Add and Verify Task Persistence",
    tc_id="TC-70",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_greeting_check": "Fresh start, Amber Demo", "task_title_order_grout_check": "Order grout dmkrhw | Vikunja", "task_title_order_grout_still_shown_check": "Order grout dmkrhw | Vikunja"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "dmkrhw", "session_value": "dmkrhw", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='6fd636fe-042c-489f-8fbe-5d45c1c2d239'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the login form to load and queued steps to run', instruction_id='86e5e7d9-0e6f-4020-ab8e-ae784f98f7f9'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='8d48addd-fc27-46bc-a930-e756756327e0'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='e85da3a0-5796-4873-b767-5607e4d992e1'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='1a6c8c5a-8324-43a8-8366-c4755b4e18f5'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='07c45633-d5cd-49e7-82ae-e5ae13adf787'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Waiting for the signed-in home page to load', instruction_id='cbea42d4-9944-4735-8c73-7521e2531efb'):
        await page.wait_for_timeout(500)
    
    async with testmu.step('Reading the home page greeting'):
        set_var('home_page_greeting_check', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.trim());\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Fresh start, Amber Demo"i]'], query='the greeting heading in the home page main content', expected_value='Amber Demo', needs_unit_conversion=False, operator='contains', transforms=['strip'], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='b12c357f-590e-4516-87ba-d694b9ecd803'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'contains', 'transforms': ['strip'], 'json_path': None, 'expected': 'Amber Demo', 'extracted_value': '{{home_page_greeting_check}}', 'store_key': 'home_page_greeting_check', 'variable_refs': {'{{home_page_greeting_check}}': 'Fresh start, Amber Demo'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_greeting_check', 'expected_value': 'Amber Demo', 'extracted_value': '{{home_page_greeting_check}}', 'operator': 'contains', 'transforms': ['strip']}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Kitchen renovation in the left sidebar project list', instruction_id='a86e8420-5821-4a4d-8574-b3637a774b3b'):
        _loc_3 = page.locator("internal:label=\"Projects\"i >> internal:role=link[name=\"Kitchen renovation\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Waiting for the queued plan to complete', instruction_id='fe1fd9aa-fa9a-46ae-b9c7-7b3f1b4426dd'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "Order grout {{global.amber_tag}}" into "Add a task…"', instruction_id='afe87853-bbff-4226-bc53-d077cc2fb708'):
        element_4 = page.locator("internal:role=textbox[name=\"Add a task…\"i]")
        variable_value_5 = var('Order grout {{global.amber_tag}}')
        
        await testmu.fill(element_4, variable_value_5)
    
    async with testmu.step('Click "Add"', instruction_id='05d7fa18-9ab2-4fc7-acf2-3ed0c93d5acc'):
        _loc_4 = page.locator("internal:role=button[name=\"Add\"s]")
        
        await _loc_4.click()
    
    async with testmu.step('Waiting for the new task Order grout to appear in the project task list', instruction_id='0744414a-5ef7-4d27-9dfc-40e4766adaab'):
        await page.wait_for_timeout(300)
    
    async with testmu.step('PRIMARY: Open the task Order grout {{global.amber_tag}}', instruction_id='622e0d56-368d-498a-ad0f-350c0e19b2c2'):
        _loc_5 = page.locator("internal:role=link[name=\"Order grout dmkrhw\"i]")
        
        await _loc_5.click(reprobe=True)
    _condition_met = False
    _until_retries = 0
    while _until_retries < 10:
        print(f"[until-loop] iteration {_until_retries + 1}/10")
        async with testmu.step('Waiting for the task page title Order grout to be visible', instruction_id='73e352aa-fc9d-44a7-965b-efec57b2f445'):
            await page.wait_for_timeout(500)
        await page.wait_for_timeout(500)
        if await testmu.check_until_condition(page, "the task title 'Order grout dmkrhw' is visible"):
            _condition_met = True
            break
        _until_retries += 1
    set_var("__result__", {"condition_met": _condition_met, "retries": _until_retries + 1})
    
    async with testmu.step('Checking whether the task title is present', instruction_id='e4d20bd6-1212-434d-a9fe-06d171f4d43a'):
        set_var('task_title_order_grout_check', await page.title())
    
    async with testmu.step('Assertion check', instruction_id='e6dfa2f0-2158-405e-9e6a-15f2e89224cd'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the task page shows the title Order grout {{global.amber_tag}}', 'passed': True, 'operator': 'contains', 'transforms': [], 'json_path': None, 'expected': 'Order grout dmkrhw', 'extracted_value': '{{task_title_order_grout_check}}', 'store_key': 'task_title_order_grout_check', 'variable_refs': {'{{task_title_order_grout_check}}': 'Order grout dmkrhw | Vikunja', '{{global.amber_tag}}': 'dmkrhw'}}], 'sub_checks': [{'description': 'the task page shows the title Order grout {{global.amber_tag}}', 'store_key': 'task_title_order_grout_check', 'expected_value': 'Order grout dmkrhw', 'extracted_value': '{{task_title_order_grout_check}}', 'operator': 'contains', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the task page shows the title Order grout {{global.amber_tag}}'})
    
    async with testmu.step('Navigate refresh', instruction_id='67fae3e3-225b-41ac-9852-2cc45342532f'):
        await page.reload()
    
    async with testmu.step('Waiting for the task page to reload and confirm Order grout tag', instruction_id='06f13579-a132-4c10-869b-5b4d8fb1838b'):
        await page.wait_for_timeout(300)
    
    async with testmu.step('Reading the current page title', instruction_id='cc8458dd-6ff9-4b64-9b21-010d668e555d'):
        set_var('task_title_order_grout_still_shown_check', await page.title())
    
    async with testmu.step('Assertion check', instruction_id='c64997e1-6abc-47dd-a0ae-43d883266971'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the title Order grout {{global.amber_tag}} is still shown', 'passed': True, 'operator': 'contains', 'transforms': [], 'json_path': None, 'expected': 'Order grout dmkrhw', 'extracted_value': '{{task_title_order_grout_still_shown_check}}', 'store_key': 'task_title_order_grout_still_shown_check', 'variable_refs': {'{{task_title_order_grout_still_shown_check}}': 'Order grout dmkrhw | Vikunja', '{{global.amber_tag}}': 'dmkrhw'}}], 'sub_checks': [{'description': 'the title Order grout {{global.amber_tag}} is still shown', 'store_key': 'task_title_order_grout_still_shown_check', 'expected_value': 'Order grout dmkrhw', 'extracted_value': '{{task_title_order_grout_still_shown_check}}', 'operator': 'contains', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the title Order grout {{global.amber_tag}} is still shown'})


if __name__ == "__main__":
    testmu.run(test)