import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="20d9881d-6540-44a5-bbb2-a9c332c14d84",
    name="Verify Amber Block Interaction and Caption",
    tc_id="TC-94",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"amber_block_line_text": "21 OF 21 INTERACTIONS PROVEN WITH THE SERVER OFF", "caption_mentions_kane_cli": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "kwfjbe", "session_value": "kwfjbe", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/amber/', instruction_id='d4ebf283-c753-4e93-8c7d-4b86ddee7515'):
        await page.goto("http://127.0.0.1:4790/amber/")
    
    async with testmu.step('Reading the line above the amber block'):
        set_var('amber_block_line_text', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {2: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(2).innerText.trim());\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="21 of 21 interactions proven"i'], query='the line above the amber block', expected_value='21 of 21 interactions proven with the server off', needs_unit_conversion=False, operator='equals', transforms=['strip', 'lowercase'], condition='the line above the amber block reads 21 of 21 interactions proven with the server off'))
    
    async with testmu.step('Checking whether the caption mentions Kane CLI'):
        set_var('caption_mentions_kane_cli', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {31: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(31).innerText.includes('Kane CLI'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="Vikunja v2.8.0 with its"i'], query='whether the caption below the amber block mentions Kane CLI', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the caption below the block mentions Kane CLI'))
    
    async with testmu.step('Assertion check', instruction_id='d795f6d6-ef6f-4377-97d3-4075b3cb6fe8'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the line above the amber block reads 21 of 21 interactions proven with the server off', 'passed': True, 'operator': 'equals', 'transforms': ['strip', 'lowercase'], 'json_path': None, 'expected': '21 of 21 interactions proven with the server off', 'extracted_value': '{{amber_block_line_text}}', 'store_key': 'amber_block_line_text', 'variable_refs': {'{{amber_block_line_text}}': '21 OF 21 INTERACTIONS PROVEN WITH THE SERVER OFF'}}], 'sub_checks': [{'description': 'the line above the amber block reads 21 of 21 interactions proven with the server off', 'store_key': 'amber_block_line_text', 'expected_value': '21 of 21 interactions proven with the server off', 'extracted_value': '{{amber_block_line_text}}', 'operator': 'equals', 'transforms': ['strip', 'lowercase']}], 'composite_operator': 'and', 'claim': 'the line above the amber block reads 21 of 21 interactions proven with the server off'})
    
    async with testmu.step('Assertion check', instruction_id='b3787399-c47b-460c-aaa8-93c5e37dd349'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the caption below the block mentions Kane CLI', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{caption_mentions_kane_cli}}', 'store_key': 'caption_mentions_kane_cli', 'variable_refs': {'{{caption_mentions_kane_cli}}': 'true'}}], 'sub_checks': [{'description': 'the caption below the block mentions Kane CLI', 'store_key': 'caption_mentions_kane_cli', 'expected_value': 'true', 'extracted_value': '{{caption_mentions_kane_cli}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the caption below the block mentions Kane CLI'})


if __name__ == "__main__":
    testmu.run(test)