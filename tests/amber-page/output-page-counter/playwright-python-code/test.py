import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="9df5ddab-1397-46d9-b568-7513f45d3aa9",
    name="Verify Amber Block Interaction Status and Caption",
    tc_id="TC-64",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"amber_block_line_text": "15 OF 15 INTERACTIONS PROVEN WITH THE SERVER OFF", "block_caption_kane_cli": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "kfxzzv", "session_value": "kfxzzv", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/amber/', instruction_id='99363cf4-1cde-4881-9c03-a92ee9c0cd83'):
        await page.goto("http://127.0.0.1:4790/amber/")
    
    async with testmu.step('Reading the status line above the amber block'):
        set_var('amber_block_line_text', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {2: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(2).innerText.trim());\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="15 of 15 interactions proven"i'], query='the status line above the amber block', expected_value='15 of 15 interactions proven with the server off', needs_unit_conversion=False, operator='equals', transforms=['strip', 'lowercase'], condition='the line above the amber block reads 15 of 15 interactions proven with the server off'))
    
    async with testmu.step('Checking whether the caption below the amber block mentions Kane CLI'):
        set_var('block_caption_kane_cli', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {25: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(25).innerText.includes('Kane CLI'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="Vikunja v2.8.0 with its"i'], query='whether Kane CLI is present in the caption below the amber block', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the caption below the block mentions Kane CLI'))
    
    async with testmu.step('Assertion check', instruction_id='0a3154d2-c687-4175-a587-2fef928b8d9f'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the line above the amber block reads 15 of 15 interactions proven with the server off', 'passed': True, 'operator': 'equals', 'transforms': ['strip', 'lowercase'], 'json_path': None, 'expected': '15 of 15 interactions proven with the server off', 'extracted_value': '{{amber_block_line_text}}', 'store_key': 'amber_block_line_text', 'variable_refs': {'{{amber_block_line_text}}': '15 OF 15 INTERACTIONS PROVEN WITH THE SERVER OFF'}}], 'sub_checks': [{'description': 'the line above the amber block reads 15 of 15 interactions proven with the server off', 'store_key': 'amber_block_line_text', 'expected_value': '15 of 15 interactions proven with the server off', 'extracted_value': '{{amber_block_line_text}}', 'operator': 'equals', 'transforms': ['strip', 'lowercase']}], 'composite_operator': 'and', 'claim': 'the line above the amber block reads 15 of 15 interactions proven with the server off'})
    
    async with testmu.step('Assertion check', instruction_id='f21fefcb-6fcc-479f-8a13-ecfd382bb8bb'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the caption below the block mentions Kane CLI', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{block_caption_kane_cli}}', 'store_key': 'block_caption_kane_cli', 'variable_refs': {'{{block_caption_kane_cli}}': 'true'}}], 'sub_checks': [{'description': 'the caption below the block mentions Kane CLI', 'store_key': 'block_caption_kane_cli', 'expected_value': 'true', 'extracted_value': '{{block_caption_kane_cli}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the caption below the block mentions Kane CLI'})


if __name__ == "__main__":
    testmu.run(test)