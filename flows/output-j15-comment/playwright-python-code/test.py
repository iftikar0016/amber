import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="5df9213c-6d21-47d7-8bbf-b55955286c63",
    name="Add and Verify Task Comment Persistence",
    tc_id="TC-44",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_greeting_amber_demo": "true", "third_quote_comment_shown": "true", "two_quotes_in_so_far_comment_shown": "true", "third_quote_comment_still_shown": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "dszhls", "session_value": "dszhls", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='b92c3a7e-408f-4fe2-b27d-59a7b0749c29'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the plan queue to start', instruction_id='80c6958b-1551-4e9c-83c2-25d001f31b7a'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='43cba2e3-9ad3-47b9-acb9-d5f0ee4f36eb'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='da05eb90-52c6-49a8-bd4c-596208322c29'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='6c5ed6d6-edf3-4275-8f7f-acb032eec484'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='0976b982-7628-479d-a400-38654d67b2de'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_greeting_amber_demo', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (/Amber Demo/.test(el(60).innerText));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Still at it, Amber Demo?"i]'], query='whether the home page greeting heading contains Amber Demo', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='ad1726d5-1ba1-470a-96ba-7eed5f4cd907'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'store_key': 'home_page_greeting_amber_demo', 'variable_refs': {'{{home_page_greeting_amber_demo}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_greeting_amber_demo', 'expected_value': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Kitchen renovation in Projects navigation', instruction_id='e7eb4919-c4e4-475e-9b52-8c471e55234a'):
        _loc_3 = page.locator("internal:label=\"Projects\"i >> internal:role=link[name=\"Kitchen renovation\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Clicking Get three quotes', instruction_id='5de2744e-5dab-42a6-8bc2-bf0d16df1fd7'):
        _loc_4 = page.locator("internal:role=link[name=\"Get three quotes\"i]")
        
        await _loc_4.click()
    
    async with testmu.step('Waiting for the comment box to load', instruction_id='58b86021-9945-45e7-902b-053f397df9fc'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "Third quote {{global.amber_tag}}" into "Add your comment, hit \'/\' for more options…"', instruction_id='aec3aff7-06cf-4450-8be6-07e7e365a756'):
        element_4 = page.locator("internal:label=\"Add your comment, hit '/' for\"i")
        variable_value_5 = var('Third quote {{global.amber_tag}}')
        
        await testmu.fill(element_4, variable_value_5)
    
    async with testmu.step('Click "COMMENT"', instruction_id='a53886e6-ba07-469d-9afc-095be93209c5'):
        _loc_5 = page.locator("internal:role=button[name=\"Comment\"i]")
        
        await _loc_5.click()
    
    async with testmu.step('Checking whether the third quote comment is present'):
        set_var('third_quote_comment_shown', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {117: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(117).innerText.trim() === 'Third quote {{global.amber_tag}}');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="Third quote dszhls"i'], query='whether the comment text Third quote {{global.amber_tag}} is present in the task comments', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the comments show Third quote {{global.amber_tag}}', variables={'global.amber_tag': var('{{global.amber_tag}}')}, reprobe=True))
    
    async with testmu.step('Checking whether the two quotes comment is present'):
        set_var('two_quotes_in_so_far_comment_shown', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {103: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(103).innerText.includes('Two quotes in so far'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="Two quotes in so far, waiting"i'], query='whether the comment text Two quotes in so far is present in the task comments', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the comments show Two quotes in so far'))
    
    async with testmu.step('Assertion check', instruction_id='9c5ebabd-0b96-4f4a-ac47-2bcd4f6b6350'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the comments show Third quote {{global.amber_tag}}', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{third_quote_comment_shown}}', 'store_key': 'third_quote_comment_shown', 'variable_refs': {'{{third_quote_comment_shown}}': 'true', '{{global.amber_tag}}': 'dszhls'}}, {'description': 'the comments show Two quotes in so far', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{two_quotes_in_so_far_comment_shown}}', 'store_key': 'two_quotes_in_so_far_comment_shown', 'variable_refs': {'{{two_quotes_in_so_far_comment_shown}}': 'true'}}], 'sub_checks': [{'description': 'the comments show Third quote {{global.amber_tag}}', 'store_key': 'third_quote_comment_shown', 'expected_value': 'true', 'extracted_value': '{{third_quote_comment_shown}}', 'operator': 'equals', 'transforms': []}, {'description': 'the comments show Two quotes in so far', 'store_key': 'two_quotes_in_so_far_comment_shown', 'expected_value': 'true', 'extracted_value': '{{two_quotes_in_so_far_comment_shown}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the comments show both Third quote {{global.amber_tag}} and Two quotes in so far'})
    
    async with testmu.step('Navigate refresh', instruction_id='5776f1a5-c40a-4a01-b88d-21a7e0969daf'):
        await page.reload()
    
    async with testmu.step('Checking whether the third quote comment is present'):
        set_var('third_quote_comment_still_shown', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {117: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(117).innerText.trim() === 'Third quote {{global.amber_tag}}');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="Third quote dszhls"i'], query='whether the comment Third quote {{global.amber_tag}} is present in the task comments', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Third quote {{global.amber_tag}} is still shown', variables={'global.amber_tag': var('{{global.amber_tag}}')}, reprobe=True))
    
    async with testmu.step('Assertion check', instruction_id='283673df-a0ba-4692-a824-ae9f8f6f2c99'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'Third quote {{global.amber_tag}} is still shown', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{third_quote_comment_still_shown}}', 'store_key': 'third_quote_comment_still_shown', 'variable_refs': {'{{third_quote_comment_still_shown}}': 'true', '{{global.amber_tag}}': 'dszhls'}}], 'sub_checks': [{'description': 'Third quote {{global.amber_tag}} is still shown', 'store_key': 'third_quote_comment_still_shown', 'expected_value': 'true', 'extracted_value': '{{third_quote_comment_still_shown}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'Third quote {{global.amber_tag}} is still shown'})


if __name__ == "__main__":
    testmu.run(test)