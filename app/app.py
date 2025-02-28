import os
import logging
from shiny import reactive, render, ui
import shiny
from shiny.types import FileInfo
from rag_workflow import RagWorkflow
from langfuse.openai import OpenAI 
from langfuse.decorators import observe
from models.workflow import FileProcessedError
from typing import List, Optional
from make_patent_component import (
    generate_background,
    generate_summary,
    generate_field_of_invention,
    generate_disease_overview,
    generate_target_overview,
    generate_high_level_concept,
    generate_underlying_mechanism,
    generate_embodiment,
    generate_claims,
    generate_abstract,
    generate_key_terms,
)

from utils.langfuse_client import get_langfuse_instance
from utils.normalize_filename import normalize_filename

langfuse =  get_langfuse_instance()

ENVIRONMENT = os.getenv("ENV")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

openai = OpenAI()

@observe(name="section_reasoning")
def section_reasoning(chunks:str, prompt: str ):
    return openai.chat.completions.create(
        model="gpt-4o",
        messages=[
          {"role": "system", "content": "You are a great scientific analyst who is extensively knowledgeable in microbiologics and patent applications."},
          {"role": "user", "content": f"provide an answer to the question {prompt} using the following document segments as your reference: \n{chunks}"}
        ],
    ).choices[0].message.content

# Define UI
app_ui = ui.page_fixed(
    ui.card(ui.card_header(ui.h3("Inputs")),
            ui.card_body(
                ui.card(ui.card_header(ui.p("Antigen")),
                        ui.card_body(ui.input_text_area("antigen", "")),
                        height=150,
                        min_height=150),
                ui.card(ui.card_header(ui.p("Disease")),
                        ui.card_body(ui.input_text_area(
                            "disease",
                            "",
                        )),
                        height=150,
                        min_height=150),
                ui.card(
                        ui.card_body(
                            ui.input_text("approach_prompt", "approach input"),
                            ui.input_action_button("generate_approach", "start", class_="btn btn-success p-0", width="3vw"),
                            ui.output_ui("approach",
                                               "",
                                               width="3vw",
                                               height="2vw",
                                               rows=5),
                            ui.input_file("approach_file", "", accept="application/pdf", multiple=True, button_label="search"),
                            ),
                        height=550,
                        min_height=550),
                ui.card(
                        ui.card_body(
                            ui.input_text("technology_prompt", "technology input"),
                            ui.input_action_button("generate_technology", "start", class_="btn btn-success p-0", width="3vw"),
                            ui.output_ui("technology",
                                               "",
                                               width="100%",
                                               height="100%",
                                               rows=5),
                            ),
                        ui.input_file("technology_file", "", accept="application/pdf", multiple=True, button_label="search"),
                        height=550,
                        min_height=550),
                ui.card(
                        ui.card_body(
                            ui.div(
                                ui.input_text("innovation_prompt", "innovation input"),
                                ui.input_action_button("generate_innovation", "start", class_="btn btn-success p-0", width="3vw")
                                ),
                            ui.output_ui("innovation",
                                               "",
                                               width="100%",
                                               height="100%",
                                               rows=5)),
                        ui.input_file("innovation_file", "", accept="application/pdf", multiple=True, button_label="search"),
                        height=550,
                        min_height=550),
            ),
            ui.card_footer(
                ui.input_action_button("generate", "generate", width="100%")),
            height=600),
    ui.card(ui.output_ui("background_card", height="100%", padding="0")),
    ui.card(ui.output_ui("summary_card", height="100%", padding="0")),
    ui.card(ui.output_ui("field_of_invention_card", height="100%",
                         padding="0")),
    ui.h3("Detailed description"),
    ui.h4("1. Disease Background & Relevance"),
    ui.card(
        ui.output_ui("disease_overview_card", height="100%", padding="0"),
        min_height="100%",
        max_height="100%",
        class_="p-0",  # Placeholder for dynamically generated cards
    ),
    ui.card(
        ui.output_ui("target_overview_card", height="100%", padding="0"),
        min_height="100%",
        max_height="100%",
        class_="p-0",  # Placeholder for dynamically generated cards
    ),
    ui.h4("2. Technology or Product Overview"),
    ui.input_selectize(id="copy_threshold",
                       label="Configure the copy threshold:",
                       choices={
                           "100%": "100%",
                           "50%": "50%",
                           "0%": "0%"
                       }),
    ui.card(
        ui.output_ui("high_level_concept_card", height="100%", padding="0"),
        min_height="100%",
        max_height="100%",
        class_="p-0",  # Placeholder for dynamically generated cards
    ),
    ui.card(
        ui.output_ui("underlying_mechanism_card", height="100%", padding="0"),
        min_height="100%",
        max_height="100%",
        class_="p-0",  # Placeholder for dynamically generated cards
    ),
    ui.h4("3. Embodiments (Core of the Detailed Description)"),
    ui.card(
        ui.output_ui("embodiment_card_1", height="25%", padding="0"),
        ui.output_ui("embodiment_card_2", height="25%", padding="0"),
        ui.output_ui("embodiment_card_3", height="25%", padding="0"),
        ui.output_ui("embodiment_card_4", height="25%", padding="0"),
        min_height="100%",
        max_height="100%",
        class_="p-0",  # Placeholder for dynamically generated cards
    ),
    ui.card(ui.output_ui("embodiments_card", height="100%", padding="0")),
    ui.card(ui.output_ui("claims_card", height="100%", padding="0")),
    ui.card(ui.output_ui("abstract_card", height="100%", padding="0")),
    ui.card(ui.output_ui("key_terms_card", height="100%", padding="0")),
    height="100vh",
    title="AI Patent",
)

def generate_approach_card(response_text, card_id):
    
    return ui.card(
        ui.card_header(
            ui.p("approach")
            ),
            
            ui.card_body(
                ui.input_text_area(
                                f"{card_id}_text",
                                "",
                                response_text,
                                width="100%",
                                height="100%",
                                placeholder="data accesed from your approach document will populate this field...",
                                rows=8)
                ),
            ui.output_ui("approach_source")
            )
    
def generate_technology_card(response_text, card_id):
    return ui.card(
        ui.card_header(
            ui.p("technology")
            ),
            
            ui.card_body(
                ui.input_text_area(
                                f"{card_id}_text",
                                "",
                                response_text,
                                width="100%",
                                height="100%",
                                placeholder="data accesed from your technology document will populate this field...",
                                rows=8)
                ),
                ui.output_ui("technology_source")
            )
    
def generate_innovation_card(response_text, card_id): # TODO: compress this code by abstracting the card id
    return ui.card(
        ui.card_header(
            ui.p("Innovation")
            ),
            
            ui.card_body(
                ui.input_text_area(
                                f"{card_id}_text",
                                "",
                                response_text,
                                width="100%",
                                height="100%",
                                placeholder="data accesed from your innovation document will populate this field...",
                                rows=8)
                ),
                ui.output_ui("innovation_source")
            )
    
def generate_chunks_card(response_text, card_id):
    return ui.popover(
        ui.input_action_button(f"{card_id}_popover", "data", width="4vw", class_="btn btn-primary p-0"),
        ui.input_text_area(f"{card_id}_source_text","", response_text, rows=15, cols=25, )
        )

def generate_embodiment_card(response_text, card_id):
    return ui.card(
        ui.card_header(ui.p("Embodiment")),
        ui.card_body(
            ui.input_text_area(f"{card_id}_text",
                               "",
                               response_text,
                               rows=8,
                               cols=45)),
        ui.card_footer(
            ui.input_action_button(f"{card_id}_generate",
                                   "▶️",
                                   width="3vw",
                                   class_="btn btn-primary p-0"),
            ui.input_action_button(f"{card_id}_approve",
                                   "Approve",
                                   width="6vw",
                                   class_="btn btn-secondary p-0"),
            ui.popover(
                ui.input_action_button(f"{card_id}_retry",
                                       "Retry",
                                       width="3vw",
                                       class_="btn btn-danger p-0"),
                ui.input_text_area(f"{card_id}_retry_critique",
                                   "What should change?",
                                   placeholder="Need more detail...",
                                   rows=5,
                                   resize="none"),
                ui.input_action_button(f"{card_id}_retry_save_critique",
                                       "📝",
                                       class_="btn btn-secondary p-0"))),
        height="35%",
        padding="0")


def generate_technology(response_text, generation_step):
    response_text = str(response_text)
    step_id = generation_step.lower()

    return ui.div(
        ui.div(
            ui.input_text_area(
                f"{step_id}",
                generation_step,
                value=response_text,
                width="100%",
                height="100%",
                rows=22,
                resize="none",
            ),
            class_="card-body h-100",
        ),
        ui.div(
            ui.input_action_button(
                f"thumbs_up_{step_id}",
                "👍",
                class_="btn btn-success p-0",
                width="3vw",
                disabled=True,
            ),
            ui.popover(
                ui.input_action_button(
                    f"thumbs_down_{step_id}",
                    "👎",
                    class_="btn btn-danger p-0",
                    width="3vw",
                    disabled=True,
                ),
                ui.input_text_area(
                    f"reasoning_thumbs_down_{step_id}",
                    "thumbs down feedback",
                    height="30vh",
                    width="30vw",
                    resize="none",
                    spellcheck=True,
                    placeholder=
                    "Please provide your feedback about what you didn't like or what could be improved.",
                ),
                ui.input_action_button(
                    f"save_reasoning_thumbs_down_{step_id}",
                    "📝",
                    class_="btn btn-secondary p-0",
                    width="3vw",
                ),
                id=f"thumbs_down_popover_{step_id}",
            ),
            ui.popover(
                ui.input_action_button(
                    f"save_{step_id}",
                    "💾",
                    class_="btn btn-primary p-0",
                    width="3vw",
                    disabled=False,
                ),
                ui.input_text_area(
                    f"{step_id}_comment",
                    "comment on your changes",
                    placeholder=
                    "e.g, I edited the 'example' section because it did not accurately describe the process",
                    rows=10,
                    cols=5,
                    resize="none",
                ),
                ui.input_action_button(f"save_{step_id}_comment",
                                       "📝",
                                       class_="btn btn-secondary p-0",
                                       width="3vw"),
                id=f"{step_id}_save_popover"),
            ui.input_action_button(
                f"{step_id}_generate",
                "▶️",
                class_="btn btn-primary p-0",
                width="3vw",
                disabled=True,
            ),
            ui.popover(ui.input_action_button(f"add_component_input_{step_id}",
                                              "add input",
                                              width="6vw",
                                              class_="btn btn-secondary p-0"),
                       ui.input_text_area(
                           label=f"Extra input for {generation_step}",
                           id=f"component_input_{step_id}",
                           rows=15,
                           cols=25,
                           resize="none",
                       ),
                       style="width: 600px;",
                       id=f"component_input_{step_id}_popover"),
            ui.input_selectize("technology_copy_threshold"),
            class_="card-footer mt-2",
        ),
        class_="card h-100 p-0",
    )


def generate_card_content(response_text, generation_step):
    """
    generate the content of the output cards based on the generation step
    """
    response_text = str(response_text)
    step_id = generation_step.lower().replace(" ", "_")

    print(generation_step)
    if generation_step == "Key Terms":
        return ui.div(
            ui.div(
                ui.input_text_area(
                    f"{step_id}",
                    generation_step,
                    value=response_text,
                    width="100%",
                    height="100%",
                    rows=22,
                    resize="none",
                ),
                class_="card-body h-100",
            ),
            ui.div(
                ui.input_action_button(
                    f"thumbs_up_{step_id}",
                    "👍",
                    class_="btn btn-success p-0",
                    width="3vw",
                    disabled=True,
                ),
                ui.popover(
                    ui.input_action_button(
                        f"thumbs_down_{step_id}",
                        "👎",
                        class_="btn btn-danger p-0",
                        width="3vw",
                        disabled=True,
                    ),
                    ui.input_text_area(
                        f"reasoning_thumbs_down_{step_id}",
                        "thumbs down feedback",
                        height="30vh",
                        width="30vw",
                        resize="none",
                        spellcheck=True,
                        placeholder=
                        "Please provide your feedback about what you didn't like or what could be improved.",
                    ),
                    ui.input_action_button(
                        f"save_reasoning_thumbs_down_{step_id}",
                        "📝",
                        class_="btn btn-secondary p-0",
                        width="3vw",
                    ),
                    id=f"thumbs_down_popover_{step_id}",
                ),
                ui.popover(
                    ui.input_action_button(
                        f"save_{step_id}",
                        "💾",
                        class_="btn btn-secondary p-0",
                        width="3vw",
                        disabled=True,
                    ),
                    ui.input_text_area(
                        f"reasoning_{step_id}",
                        generation_step,
                        height="30vh",
                        width="30vw",
                        resize="none",
                        spellcheck=True,
                        placeholder=
                        "Please provide reasoning for your edits and/or feedback if applicable. this will help us improve the quality of our LLM"
                    ),
                    ui.input_action_button(
                        f"save_reasoning_{step_id}",
                        "📝",
                        class_="btn btn-secondary p-0",
                        width="3vw",
                    ),
                    id=f"{step_id}_popover",
                ),
                ui.input_action_button(
                    f"{step_id}_generate",
                    "▶️",
                    class_="btn btn-primary p-0",
                    width="3vw",
                    disabled=True,
                ),
                ui.popover(ui.input_action_button(
                    f"add_component_input_{step_id}",
                    "add input",
                    width="6vw",
                    class_="btn btn-secondary p-0"),
                           ui.input_text_area(
                               label=f"Extra input for {generation_step}",
                               id=f"component_input_{step_id}",
                               rows=10,
                               cols=5),
                           id=f"component_input_{step_id}_popover"),
                ui.input_action_button(
                    f"{step_id}_refresh",
                    "🔄",
                    class_="btn btn-primary p-0",
                    width="3vw",
                    disabled=True,
                ),
                class_="card-footer mt-2",
            ),
            class_="card h-100 p-0",
        )

    assert step_id != None

    return ui.div(
        ui.div(
            ui.input_text_area(
                f"{step_id}",
                generation_step,
                value=response_text,
                width="100%",
                height="100%",
                rows=22,
                resize="none",
            ),
            class_="card-body h-100",
        ),
        ui.div(
            ui.input_action_button(
                f"thumbs_up_{step_id}",
                "👍",
                class_="btn btn-success p-0",
                width="3vw",
                disabled=True,
            ),
            ui.popover(
                ui.input_action_button(
                    f"thumbs_down_{step_id}",
                    "👎",
                    class_="btn btn-danger p-0",
                    width="3vw",
                    disabled=True,
                ),
                ui.input_text_area(
                    f"reasoning_thumbs_down_{step_id}",
                    "thumbs down feedback",
                    height="30vh",
                    width="30vw",
                    resize="none",
                    spellcheck=True,
                    placeholder=
                    "Please provide your feedback about what you didn't like or what could be improved.",
                ),
                ui.input_action_button(
                    f"save_reasoning_thumbs_down_{step_id}",
                    "📝",
                    class_="btn btn-secondary p-0",
                    width="3vw",
                ),
                id=f"thumbs_down_popover_{step_id}",
            ),
            ui.popover(
                ui.input_action_button(
                    f"save_{step_id}",
                    "💾",
                    class_="btn btn-primary p-0",
                    width="3vw",
                    disabled=False,
                ),
                ui.input_text_area(
                    f"{step_id}_comment",
                    "comment on your changes",
                    placeholder=
                    "e.g, I edited the 'example' section because it did not accurately describe the process",
                    rows=10,
                    cols=5,
                    resize="none",
                ),
                ui.input_action_button(f"save_{step_id}_comment",
                                       "📝",
                                       class_="btn btn-secondary p-0",
                                       width="3vw"),
                id=f"{step_id}_save_popover"),
            ui.input_action_button(
                f"{step_id}_generate",
                "▶️",
                class_="btn btn-primary p-0",
                width="3vw",
                disabled=True,
            ),
            ui.popover(ui.input_action_button(f"add_component_input_{step_id}",
                                              "add input",
                                              width="6vw",
                                              class_="btn btn-secondary p-0"),
                       ui.input_text_area(
                           label=f"Extra input for {generation_step}",
                           id=f"component_input_{step_id}",
                           rows=15,
                           cols=25,
                           resize="none",
                       ),
                       style="width: 600px;",
                       id=f"component_input_{step_id}_popover"),
            class_="card-footer mt-2",
        ),
        class_="card h-100 p-0",
    )


def generate_background_card(response_text):

    generation_step = "Background"

    step_id = generation_step.lower()
    return ui.div(
        ui.div(
            ui.input_text_area(
                f"{step_id}",
                generation_step,
                value=response_text,
                width="100%",
                height="100%",
                rows=22,
                resize="none",
            ),
            class_="card-body h-100",
        ),
        ui.div(
            ui.input_action_button(
                f"thumbs_up_{step_id}",
                "👍",
                class_="btn btn-success p-0",
                width="3vw",
                disabled=True,
            ),
            ui.popover(
                ui.input_action_button(
                    f"thumbs_down_{step_id}",
                    "👎",
                    class_="btn btn-danger p-0",
                    width="3vw",
                    disabled=True,
                ),
                ui.input_text_area(
                    f"reasoning_thumbs_down_{step_id}",
                    "thumbs down feedback",
                    height="30vh",
                    width="30vw",
                    resize="none",
                    spellcheck=True,
                    placeholder=
                    "Please provide your feedback about what you didn't like or what could be improved.",
                ),
                ui.input_action_button(
                    f"save_reasoning_thumbs_down_{step_id}",
                    "📝",
                    class_="btn btn-secondary p-0",
                    width="3vw",
                ),
                id=f"thumbs_down_popover_{step_id}",
            ),
            ui.popover(
                ui.input_action_button(
                    f"save_{step_id}",
                    "💾",
                    class_="btn btn-primary p-0",
                    width="3vw",
                    disabled=False,
                ),
                ui.input_text_area(
                    f"{step_id}_comment",
                    "comment on your changes",
                    placeholder=
                    "e.g, I edited the 'example' section because it did not accurately describe the process",
                    rows=10,
                    cols=5,
                    resize="none",
                ),
                ui.input_action_button(f"save_{step_id}_comment",
                                       "📝",
                                       class_="btn btn-secondary p-0",
                                       width="3vw"),
                id=f"{step_id}_save_popover"),
            ui.popover(ui.input_action_button(f"add_component_input_{step_id}",
                                              "add input",
                                              width="6vw",
                                              class_="btn btn-secondary p-0"),
                       ui.input_text_area(
                           label=f"Extra input for {generation_step}",
                           id=f"component_input_{step_id}",
                           rows=15,
                           cols=25,
                           resize="none",
                       ),
                       style="width: 600px;",
                       id=f"component_input_{step_id}_popover"),
            class_="card-footer mt-2",
        ),
        class_="card h-100 p-0",
    )


shared_state = {
    "background_trace": None,
    "field_of_invention_trace": None,
    "summary_trace": None,
    "primary_invention_trace": None,
    "technology_trace": None,
    "description_trace": None,
    "product_trace": None,
}


def generate_embodiments_card(response_text, generation_step):
    step_id = generation_step.lower()

    return ui.div(
        ui.div(
            ui.input_text_area(
                f"{step_id}",
                generation_step,
                value=response_text,
                width="100%",
                height="100%",
                rows=22,
                resize="none",
            ), ))


# Define Server Logic
def server(input, output, session):
    """
    server function for shiny app
    """
    
    @reactive.calc
    def parse_approach_file() -> Optional[List[dict[str,str]]]:
        file: list[FileInfo] | None = input.approach_file()
        if file is None:
            return None
        files = []
        for f in file:
            files.append({"approach_filepath":f["datapath"], "approach_filename":f["name"]})
        return files
    
    @reactive.calc
    def parse_innovation_file():
        file: list[FileInfo] | None = input.innovation_file()
        if file is None:
            return None
        files = []
        for f in file:
            files.append({"innovation_filepath":f["datapath"], "innovation_filename":f["name"]})
        return files

    @reactive.calc
    def parse_technology_file():
        file: list[FileInfo] | None = input.technology_file()
        if file is None:
            return None
        files = []
        for f in file:
            files.append({"technology_filepath":f["datapath"], "technology_filename":f["name"]})
        return files
    
    
    # Create a reactive value to store the generated primary invention
    generated_background = reactive.Value("")
    generated_summary = reactive.Value("")
    generated_field_of_invention = reactive.Value("")
    generated_key_terms = reactive.Value("")
    generated_disease_overview = reactive.Value("")
    generated_target_overview = reactive.Value("")
    generated_high_level_concept = reactive.Value("")
    generated_underlying_mechanism = reactive.Value("")
    
    generated_embodiment_1 = reactive.Value("")
    generated_embodiment_2 = reactive.Value("")
    generated_embodiment_3 = reactive.Value("")
    generated_embodiment_4 = reactive.Value("")
    generated_embodiments = reactive.Value("")
    
    generated_claims = reactive.Value("")
    generated_abstract = reactive.Value("")
    
    generated_approach = reactive.Value("")
    generated_technology = reactive.Value("")
    generated_innovation = reactive.Value("")
    
    retrieved_approach = reactive.Value("")
    retrieved_technology = reactive.Value("")
    retrieved_innovation = reactive.Value("")
    
    
    approach_rag = RagWorkflow()
    @reactive.Effect
    @reactive.event(input.approach_file)
    async def on_approach_file_upload():
        filedata = parse_approach_file()
        
        if len(filedata) == 1:
            logging.info(f"single file, {filedata}")
            filepath  = filedata[0]["approach_filepath"]
            filename = filedata[0]["approach_filename"]
            if filepath:
                result = await approach_rag.aprocess_file(filepath, filename)
                
                # check if the file already exists in the database
                if isinstance(result, FileProcessedError):
                    # make the rag workflow point to the existing table 
                    approach_rag.set_table_name(filename=filename)
                else:
                    approach_rag.create_table_from_file(filepath)
            return
        
        else:
            filepaths = []
            file_tuples = []
            logging.info(f"uploaded multiple approach files")
            for file in filedata:    
                filepath = file["approach_filepath"]
                filepaths.append(filepath)
                
                filename = normalize_filename(file["approach_filename"])
                file = (filepath, filename)
                
                file_tuples.append(file)
                
                logging.info(f"appended file: {file}")
                
            if file_tuples:
                result = approach_rag.process_files(file_tuples)
                approach_rag.create_table_from_files(filepaths)
        
        logging.info("on_approach_file_upload completed successfully")
                
    @reactive.Effect
    @reactive.event(input.generate_approach)
    def on_generate_approach():
        prompt = input.approach_prompt()
        
        # display a warning if prompt is empty
        if prompt == "":
            ui.notification_show("please provide an approach input",type="error", duration=3) 
            return
        
        chunks = approach_rag.multiquery_search(prompt) 
        result = section_reasoning(chunks, prompt)
        
        retrieved_approach.set(chunks)
        generated_approach.set(result)        
    
    
    technology_rag = RagWorkflow()
    @reactive.Effect
    @reactive.event(input.technology_file)
    async def on_technology_file_upload():     
        filedata = parse_technology_file()
        
        if len(filedata) == 1:
            logging.info(f"single file, {filedata}")
            filepath  = filedata[0]["technology_filepath"]
            filename = filedata[0]["technology_filename"]
            if filepath:
                result = await technology_rag.aprocess_file(filepath, filename)
                
                # check if the file already exists in the database
                if isinstance(result, FileProcessedError):
                    # make the rag workflow point to the existing table 
                    technology_rag.set_table_name(filename=filename)
                else:
                    technology_rag.create_table_from_file(filepath)
            return
        
        else:
            filepaths = []
            file_tuples = []
            logging.info(f"uploaded multiple technology files")
            for file in filedata:    
                filepath = file["technology_filepath"]
                filepaths.append(filepath)
                
                filename = normalize_filename(file["technology_filename"])
                file = (filepath, filename)
                
                file_tuples.append(file)
                
                logging.info(f"appended file: {file}")
                
            if file_tuples:
                result = technology_rag.process_files(file_tuples)
                technology_rag.create_table_from_files(filepaths)
            
            logging.info("on_technology_file_upload completed successfully")
                
    @reactive.Effect
    @reactive.event(input.generate_technology)
    def on_generate_technology():
        prompt = input.technology_prompt()
        
        # display a warning if prompt is empty
        if prompt == "":
            ui.notification_show("please provide a technology input",type="error", duration=3) 
            return
        
        chunks = technology_rag.multiquery_search(prompt)
        result = section_reasoning(chunks, prompt)
        
        retrieved_technology.set(chunks)
        generated_technology.set(result)
    
    
    innovation_rag = RagWorkflow()
    @reactive.Effect
    @reactive.event(input.innovation_file)
    async def on_innovation_file_upload():
        filedata = parse_innovation_file()
        
        if len(filedata) == 1:
            logging.info(f"single file, {filedata}")
            filepath  = filedata[0]["innovation_filepath"]
            filename = filedata[0]["innovation_filename"]
            if filepath:
                result = await innovation_rag.aprocess_file(filepath, filename)
                
                # check if the file already exists in the database
                if isinstance(result, FileProcessedError):
                    # make the rag workflow point to the existing table 
                    innovation_rag.set_table_name(filename=filename)
                else:
                    innovation_rag.create_table_from_file(filepath)
            return
        
        else:
            filepaths = []
            file_tuples = []
            logging.info(f"uploaded multiple innovation files")
            for file in filedata:    
                filepath = file["innovation_filepath"]
                filepaths.append(filepath)
                
                filename = normalize_filename(file["innovation_filename"])
                file = (filepath, filename)
                
                file_tuples.append(file)
                
                logging.info(f"appended file: {file}")
                
            if file_tuples:
                result = innovation_rag.process_files(file_tuples)
                innovation_rag.create_table_from_files(filepaths)
        
        logging.info("on_innovation_file_upload completed successfully")
    
    @reactive.Effect
    @reactive.event(input.generate_innovation)
    def on_generate_innovation():
        prompt = input.innovation_prompt()
        
        
        # display a warning if prompt is empty
        if prompt == "":
            ui.notification_show("please provide an innovation input",type="error", duration=3) 
            return
        chunks = innovation_rag.multiquery_search(prompt)
        result = section_reasoning(chunks, prompt)
        
        retrieved_innovation.set(chunks)
        generated_innovation.set(result)        
    
            
    @reactive.Effect
    @reactive.event(input.generate)
    def on_start_generation():

        antigen = input.antigen()
        disease = input.disease()
        innovation = input.innovation()
        technology = input.technology()
        approach = input.approach()
        additional = input.component_input_background()

        ui.update_action_button("thumbs_up_background", disabled=False)
        ui.update_action_button("thumbs_down_background", disabled=False)
        ui.update_action_button("summary_generate", disabled=False)

        if not antigen and not disease:
            ui.notification_show("missing antigen and disease",
                                 duration=2,
                                 type="error")
            return
        if not antigen:
            ui.notification_show("missing antigen", duration=2, type="error")
            return
        if not disease:
            ui.notification_show("missing disease", duration=2, type="error")
            return

        # Log the collected inputs for debugging
        logging.info(f"Antigen: {antigen}")
        logging.info(f"Disease: {disease}")

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}, additional: {additional}"
            generated_background.set(response)
        else:
            response = generate_background(
                innovation,
                technology,
                approach,
                antigen,
                disease,
                additional
            )

            shared_state["background_trace"] = langfuse.trace(
                id=response.trace_id)

            # Debugging: Log the response
            logging.info("Generated Background")

            generated_background.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.summary_generate)
    def on_summary_generate():
        background_edit = input.background()
        antigen = input.antigen()
        disease = input.disease()
        innovation = input.innovation()
        technology = input.technology()
        approach = input.approach()
        additional = input.component_input_summary()

        ui.update_action_button("summary_generate", disabled=True)

        ui.update_action_button("thumbs_down_summary", disabled=False)
        ui.update_action_button("thumbs_up_summary", disabled=False)

        ui.update_action_button("field_of_invention_generate", disabled=False)

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}, additional: {additional}"
            generated_summary.set(response)

        else:
            response = generate_summary(
                innovation,
                technology,
                approach,
                antigen,
                disease,
                additional
            )
            ui.update_action_button("summary_generate", disabled=False)
            shared_state["summary_trace"] = langfuse.trace(
                id=response.trace_id)

            logging.info("Generated Summary")

            generated_summary.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.field_of_invention_generate)
    def on_field_of_invention_generate():
        summary_content = input.summary()
        antigen = input.antigen()
        disease = input.disease()
        innovation = input.innovation()
        technology = input.technology()
        approach = input.approach()
        additional = input.component_input_field_of_invention()

        ui.update_action_button("field_of_invention_generate", disabled=True)

        ui.update_action_button("thumbs_down_field_of_invention",
                                disabled=False)
        ui.update_action_button("thumbs_up_field_of_invention", disabled=False)

        ui.update_action_button("disease_overview_generate", disabled=False)

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}, additional: {additional}"
            generated_field_of_invention.set(response)

        else:
            response = generate_field_of_invention(
                innovation,
                technology,
                approach,
                antigen,
                disease,
                additional
            )

            shared_state["field_of_invention_trace"] = langfuse.trace(
                id=response.trace_id)

            logging.info("Generated field of invention")

            generated_field_of_invention.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.disease_overview_generate)
    def on_disease_overview_generate():
        field_of_invention_content = input.field_of_invention()
        antigen = input.antigen()
        disease = input.disease()

        additional = input.component_input_disease_overview()

        if shared_state["filepath"]:
            context = rag.formatted_search(f"what is {disease}?")

        ui.update_action_button("disease_overview_generate", disabled=True)

        ui.update_action_button("thumbs_down_disease_overview", disabled=False)
        ui.update_action_button("thumbs_up_disease_overview", disabled=False)

        ui.update_action_button("target_overview_generate", disabled=False)

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}, additional: {additional}"
            generated_disease_overview.set(response)

        else:
            response = generate_disease_overview(disease, additional, context)

            shared_state["disease_overview_trace"] = langfuse.trace(
                id=response.trace_id)

            logging.info("Generated Disease Overview")

            generated_disease_overview.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.target_overview_generate)
    def on_target_overview_generate():
        target_overview_content = input.target_overview()
        antigen = input.antigen()
        disease = input.disease()
        innovation = input.innovation()
        technology = input.technology()
        approach = input.approach()
        additional = input.component_input_target_overview()

        if shared_state["filepath"]:
            context = rag.formatted_search(f"how does {antigen} interact with {disease}?")
        ui.update_action_button("target_overview_generate", disabled=True)

        ui.update_action_button("thumbs_down_target_overview", disabled=False)
        ui.update_action_button("thumbs_up_target_overview", disabled=False)

        ui.update_action_button("high_level_concept_generate", disabled=False)

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}, additional: {additional}"
            generated_target_overview.set(response)

        else:
            response = generate_target_overview(
                innovation,
                technology,
                approach,
                antigen,
                disease,
                additional,
                context
            )

            shared_state["target_overview_trace"] = langfuse.trace(
                id=response.trace_id)

            logging.info("Generated Target Overview")

            generated_target_overview.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.high_level_concept_generate)
    def on_high_level_concept_generate():
        high_level_concept_content = input.high_level_concept()
        antigen = input.antigen()
        disease = input.disease()
        innovation = input.innovation()
        technology = input.technology()
        approach = input.approach()
        additional = input.component_input_high_level_concept()

        ui.update_action_button("high_level_concept_generate", disabled=True)

        ui.update_action_button("thumbs_down_high_level_concept",
                                disabled=False)
        ui.update_action_button("thumbs_up_high_level_concept", disabled=False)

        ui.update_action_button("underlying_mechanism_generate",
                                disabled=False)

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}, additional: {additional}"
            generated_high_level_concept.set(response)

        else:
            response = generate_high_level_concept(
                innovation,
                technology,
                approach,
                antigen,
                disease,
                additional
            )

            shared_state["high_level_concept_trace"] = langfuse.trace(
                id=response.trace_id)

            logging.info("Generated High Level Concept")

            generated_high_level_concept.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.underlying_mechanism_generate)
    def on_underlying_mechanism_generate():
        underlying_mechanism_content = input.underlying_mechanism()
        antigen = input.antigen()
        disease = input.disease()
        innovation = input.innovation()
        technology = input.technology()
        approach = input.approach()
        additional = input.component_input_underlying_mechanism()

        ui.update_action_button("underlying_mechanism_generate", disabled=True)

        ui.update_action_button("thumbs_down_underlying_mechanism",
                                disabled=False)
        ui.update_action_button("thumbs_up_underlying_mechanism",
                                disabled=False)

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}, additional: {additional}"
            generated_underlying_mechanism.set(response)

        else:
            response = generate_underlying_mechanism(
                innovation,
                technology,
                approach,
                antigen,
                disease,
                additional
            )

            shared_state["underlying_mechanism_trace"] = langfuse.trace(
                id=response.trace_id)

            logging.info("Generated High Level Concept")

            generated_underlying_mechanism.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.embodiment_1_generate)
    def on_embodiment_1_generate():
        antigen = input.antigen()
        disease = input.disease()
        innovation = input.innovation()
        technology = input.technology()
        approach = input.approach()

        ui.update_action_button("embodiment_1_generate", disabled=True)

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}"
            generated_embodiment_1.set(response)

        else:
            response = generate_embodiment(
                "no previous embodiment, just ignore and generate the first one",
                innovation,
                technology,
                approach,
                antigen,
                disease,
            )

            shared_state["embodiment_1_trace"] = langfuse.trace(
                id=response.trace_id)

            logging.info("Generated First Embodiment")

            generated_embodiment_1.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.embodiment_2_generate)
    def on_embodiment_2_generate():
        embodiment_1_content = input.embodiment_1_text()
        antigen = input.antigen()
        disease = input.disease()
        innovation = input.innovation()
        technology = input.technology()
        approach = input.approach()

        ui.update_action_button("embodiment_2_generate", disabled=True)

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}"
            generated_embodiment_2.set(response)

        else:
            response = generate_embodiment(
                embodiment_1_content,
                innovation,
                technology,
                approach,
                antigen,
                disease,
            )

            shared_state["embodiment_2_trace"] = langfuse.trace(
                id=response.trace_id)

            logging.info("Generated First Embodiment")

            generated_embodiment_2.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.embodiment_3_generate)
    def on_embodiment_3_generate():
        embodiment_1_content = input.embodiment_1_text()
        embodiment_2_content = input.embodiment_2_text()
        antigen = input.antigen()
        disease = input.disease()
        innovation = input.innovation()
        technology = input.technology()
        approach = input.approach()

        ui.update_action_button("embodiment_3_generate", disabled=True)

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}"
            generated_embodiment_3.set(response)

        else:
            response = generate_embodiment(
                f"{embodiment_1_content},\n {embodiment_2_content}",
                innovation,
                technology,
                approach,
                antigen,
                disease,
            )

            shared_state["embodiment_3_trace"] = langfuse.trace(
                id=response.trace_id)

            logging.info("Generated First Embodiment")

            generated_embodiment_3.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.embodiment_4_generate)
    def on_embodiment_4_generate():
        embodiment_1_content = input.embodiment_1_text()
        embodiment_2_content = input.embodiment_2_text()
        embodiment_3_content = input.embodiment_3_text()
        antigen = input.antigen()
        disease = input.disease()
        innovation = input.innovation()
        technology = input.technology()
        approach = input.approach()
        

        ui.update_action_button("embodiment_4_generate", disabled=True)
        ui.update_action_button("claims_generate", disabled=False)

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}"
            generated_embodiment_4.set(response)

        else:
            response = generate_embodiment(
                f"{embodiment_1_content},\n {embodiment_2_content},\n {embodiment_3_content}\n",
                innovation,
                technology,
                approach,
                antigen,
                disease,
            )

            shared_state["embodiment_4_trace"] = langfuse.trace(
                id=response.trace_id)

            logging.info("Generated First Embodiment")

            generated_embodiment_4.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.embodiment_1_approve)
    def on_embodiment_1_approve():
        embodiment_1_content = input.embodiment_1_text()
        generated_embodiments.set(f"{embodiment_1_content}")
        ui.update_action_button("embodiment_1_approve", disabled=True)

    @reactive.Effect
    @reactive.event(input.embodiment_2_approve)
    def on_embodiment_2_approve():
        embodiment_1_content = input.embodiment_1_text()
        embodiment_2_content = input.embodiment_2_text()

        generated_embodiments.set(
            f"{embodiment_1_content},\n {embodiment_2_content}")

        ui.update_action_button("embodiment_2_approve", disabled=True)

    @reactive.Effect
    @reactive.event(input.embodiment_3_approve)
    def on_embodiment_3_approve():
        embodiment_1_content = input.embodiment_1_text()
        embodiment_2_content = input.embodiment_2_text()
        embodiment_3_content = input.embodiment_3_text()

        generated_embodiments.set(
            f"{embodiment_1_content},\n {embodiment_2_content}, \n {embodiment_3_content}"
        )

        ui.update_action_button("embodiment_3_approve", disabled=True)

    @reactive.Effect
    @reactive.event(input.embodiment_4_approve)
    def on_embodiment_4_approve():
        embodiment_1_content = input.embodiment_1_text()
        embodiment_2_content = input.embodiment_2_text()
        embodiment_3_content = input.embodiment_3_text()
        embodiment_4_content = input.embodiment_4_text()

        generated_embodiments.set(
            f"{embodiment_1_content},\n {embodiment_2_content},\n {embodiment_3_content},\n {embodiment_4_content}"
        )

        ui.update_action_button("embodiment_4_approve", disabled=True)

    @reactive.Effect
    @reactive.event(input.claims_generate)
    def on_claims_generate():
        antigen = input.antigen()
        disease = input.disease()
        innovation = input.innovation()
        technology = input.technology()
        approach = input.approach()
        additional = input.component_input_claims()

        ui.update_action_button("claims_generate", disabled=True)

        ui.update_action_button("thumbs_down_claims", disabled=False)
        ui.update_action_button("thumbs_up_claims", disabled=False)

        ui.update_action_button("abstract_generate", disabled=False)

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}, additional: {additional}"
            generated_claims.set(response)

        else:
            response = generate_claims(
                innovation,
                technology,
                approach,
                antigen,
                disease,
                additional
            )

            shared_state["claims_trace"] = langfuse.trace(id=response.trace_id)

            logging.info("Generated High Level Concept")

            generated_claims.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.abstract_generate)
    def on_abstract_generate():
        antigen = input.antigen()
        disease = input.disease()
        innovation = input.innovation()
        technology = input.technology()
        approach = input.approach()
        additional = input.component_input_abstract()

        ui.update_action_button("abstract_generate", disabled=True)

        ui.update_action_button("thumbs_down_abstract", disabled=False)
        ui.update_action_button("thumbs_up_abstract", disabled=False)

        ui.update_action_button("key_terms_generate", disabled=False)

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}, additional: {additional}"
            generated_abstract.set(response)

        else:
            response = generate_abstract(
                innovation,
                technology,
                approach,
                antigen,
                disease,
                additional
            )

            shared_state["abstract_trace"] = langfuse.trace(
                id=response.trace_id)

            logging.info("Generated Abstract")

            generated_abstract.set(response.prediction)
            
    

    @reactive.Effect
    @reactive.event(input.key_terms_generate)
    def on_key_terms_generate():
        antigen = input.antigen()
        disease = input.disease()
        innovation = input.innovation()
        technology = input.technology()
        approach = input.approach()
        additional = input.component_input_key_terms()

        ui.update_action_button("key_terms_generate", disabled=True)

        ui.update_action_button("thumbs_down_key_terms", disabled=False)
        ui.update_action_button("thumbs_up_key_terms", disabled=False)

        ui.update_action_button("key_terms_refresh", disabled=False)

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}, additional: {additional}"
            generated_key_terms.set(response)

        else:
            response = generate_key_terms(
                innovation,
                technology,
                approach,
                antigen,
                disease,
                additional
            )

            shared_state["key_terms_trace"] = langfuse.trace(
                id=response.trace_id)

            logging.info("Generated Key Terms")

            generated_key_terms.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.key_terms_refresh)
    def on_key_terms_refresh():
        """
        Clean up all the output cards
        """
        generated_background.set("")
        generated_summary.set("")
        generated_field_of_invention.set("")
        generated_disease_overview.set("")
        generated_target_overview.set("")
        generated_high_level_concept.set("")
        generated_underlying_mechanism.set("")
        generated_embodiment_1.set("")
        generated_embodiment_2.set("")
        generated_embodiment_3.set("")
        generated_embodiment_4.set("")
        generated_embodiments.set("")
        generated_claims.set("")
        generated_abstract.set("")
        generated_key_terms.set("")

        rag.cleanup(delete_file=False)

    @output
    @render.ui
    def background_card():
        return generate_background_card(generated_background())

    @output
    @render.ui
    def summary_card():
        return generate_card_content(generated_summary(), "Summary")

    @output
    @render.ui
    def field_of_invention_card():
        return generate_card_content(generated_field_of_invention(),
                                     "Field of Invention")

    @output
    @render.ui
    def disease_overview_card():
        return generate_card_content(generated_disease_overview(),
                                     "Disease Overview")

    @output
    @render.ui
    def target_overview_card():
        return generate_card_content(generated_target_overview(),
                                     "Target Overview")

    @output
    @render.ui
    def high_level_concept_card():
        return generate_card_content(generated_high_level_concept(),
                                     "High Level Concept")

    @output
    @render.ui
    def underlying_mechanism_card():
        return generate_card_content(generated_underlying_mechanism(),
                                     "Underlying Mechanism")

    @output
    @render.ui
    def embodiment_card_1():
        return generate_embodiment_card(generated_embodiment_1(),
                                        "embodiment_1")

    @output
    @render.ui
    def embodiment_card_2():
        return generate_embodiment_card(generated_embodiment_2(),
                                        "embodiment_2")

    @output
    @render.ui
    def embodiment_card_3():
        return generate_embodiment_card(generated_embodiment_3(),
                                        "embodiment_3")

    @output
    @render.ui
    def embodiment_card_4():
        return generate_embodiment_card(generated_embodiment_4(),
                                        "embodiment_4")

    @output
    @render.ui
    def embodiments_card():
        return generate_embodiments_card(generated_embodiments(),
                                         "Embodiments")

    @output
    @render.ui
    def claims_card():
        return generate_card_content(generated_claims(), "Claims")

    @output
    @render.ui
    def abstract_card():
        return generate_card_content(generated_abstract(), "Abstract")

    @output
    @render.ui
    def key_terms_card():
        return generate_card_content(generated_key_terms(), "Key Terms")
    
    @output
    @render.ui
    def approach():
        return generate_approach_card(generated_approach(), "Approach")
    
    @output
    @render.ui
    def technology():
        return generate_technology_card(generated_technology(), "Technology")
    
    @output
    @render.ui
    def innovation():
        return generate_innovation_card(generated_innovation(), "Innovation")
    
    
    @output
    @render.ui
    def approach_source():
        return generate_chunks_card(retrieved_approach(), "approach")

    @output
    @render.ui
    def technology_source():
        return generate_chunks_card(retrieved_technology(), "technology")
    
    @output
    @render.ui
    def innovation_source():
        return generate_chunks_card(retrieved_innovation(), "innovation")
    # Background
    @reactive.Effect
    @reactive.event(input.thumbs_up_background)
    def on_background_thumbs_up():
        ui.update_action_button("thumbs_down_background", disabled=True)
        ui.update_action_button("thumbs_up_background", disabled=True)
        ui.notification_show("That's an Interesting Background!",
                             duration=2,
                             type="message")

        trace = shared_state["background_trace"]

        if trace:
            trace.update(metadata={"feedback": "positive"})
        print("thumbs up")

    @reactive.Effect
    @reactive.event(input.thumbs_down_background)
    def on_background_thumbs_down():
        ui.update_action_button("thumbs_up_background", disabled=True)
        ui.update_action_button("thumbs_down_background", disabled=True)
        ui.notification_show("Not the best Background 🤷🏽‍♂️",
                             duration=2,
                             type="error")

        trace = shared_state["background_trace"]
        if trace:
            trace.update(metadata={"feedback": "negative"})
        print("thumbs down")

    @reactive.Effect()
    @reactive.event(input.background)
    def on_background_editable_content():
        print("watching changes...")
        if input.background() != "":
            print("content changed!")
            ui.update_action_button("save_background", disabled=False)

    @reactive.event(input.save_background)
    def on_save_background():
        print("save")

        background_edit = input.background()
        if ENVIRONMENT == "development":
            generated_background.set(background_edit)
        else:
            generated_background.set(background_edit)
            trace = shared_state["background_trace"]
            if trace:
                trace.event(
                    name="edit_background",
                    input=
                    "The input to this event is the background generated by the LLM",
                    output=background_edit,
                )

    @reactive.Effect
    @reactive.event(input.save_background_comment)
    def on_save_background_comment():
        print("save reasoning")
        reasoning = input.reasoning_background()

        trace = shared_state["background_trace"]
        if trace:
            trace.event(
                name="edit_reasoning_background",
                input=
                "the user comments on the background and the changes they made",
                output=reasoning,
            )

        ui.update_action_button("save_background_comment", disabled=True)

    @reactive.Effect
    @reactive.event(input.save_reasoning_thumbs_down_background)
    def on_save_reasoning_background_thumbs_down():
        print("save thumbs down reasoning")
        reasoning = input.reasoning_thumbs_down_background()
        trace = shared_state["background_trace"]
        if trace:
            trace.event(
                name="thumbs_down_reasoning_background",
                input="the user provides negative feedback",
                output=reasoning,
            )
        ui.update_action_button("save_reasoning_thumbs_down_background",
                                disabled=True)

    # Field of invention feedback logic
    @reactive.Effect
    @reactive.event(input.thumbs_up_field_of_invention)
    def on_field_of_invention_thumbs_up():
        ui.update_action_button("thumbs_down_field_of_invention",
                                disabled=True)
        ui.update_action_button("thumbs_up_field_of_invention", disabled=True)
        ui.notification_show("thumbs up_field_of_invention",
                             duration=2,
                             type="message")

        trace = shared_state["field_of_invention_trace"]

        if trace:
            trace.update(metadata={"feedback": "positive"})
        print("thumbs up")

    @reactive.Effect
    @reactive.event(input.thumbs_down_field_of_invention)
    def on_field_of_invention_thumbs_down():
        ui.update_action_button("thumbs_up_field_of_invention", disabled=True)
        ui.update_action_button("thumbs_down_field_of_invention",
                                disabled=True)
        ui.notification_show("thumbs down_field_of_invention",
                             duration=2,
                             type="error")

        trace = shared_state["field_of_invention_trace"]
        if trace:
            trace.update(metadata={"feedback": "negative"})
        print("thumbs down")

    @reactive.Effect()
    @reactive.event(input.field_of_invention)
    def on_field_of_invention_editable_content():
        print("watching changes...")
        if input.field_of_invention() != "":
            print("content changed!")
            ui.update_action_button("save_field_of_invention", disabled=False)

    @reactive.event(input.save_field_of_invention)
    def on_save_field_of_invention():
        print("save")
        ui.update_action_button("save_field_of_invention", disabled=True)

        field_of_invention_edit = input.field_of_invention()
        if ENVIRONMENT == "development":
            generated_field_of_invention.set(field_of_invention_edit)
        else:
            generated_field_of_invention.set(field_of_invention_edit)
            trace = shared_state["field_of_invention_trace"]
            if trace:
                trace.event(
                    name="edit_field_of_invention",
                    input=
                    "The input to this event is the field of invention generated by the LLM",
                    output=field_of_invention_edit,
                )

    @reactive.Effect
    @reactive.event(input.save_field_of_invention_comment)
    def on_save_field_of_invention_comment():
        print("save reasoning")
        reasoning = input.reasoning_field_of_invention()

        trace = shared_state["field_of_invention_trace"]
        if trace:
            trace.event(
                name="edit_reasoning_field_of_invention",
                input=
                "the user comments on the field of invention and the changes they made",
                output=reasoning,
            )

        ui.update_action_button("save_reasoning_field_of_invention",
                                disabled=True)

    @reactive.Effect
    @reactive.event(input.save_reasoning_thumbs_down_field_of_invention)
    def on_save_reasoning_field_of_invention_thumbs_down():
        print("save thumbs down reasoning")
        reasoning = input.reasoning_thumbs_down_field_of_invention()
        trace = shared_state["field_of_invention_trace"]
        if trace:
            trace.event(
                name="thumbs_down_reasoning_field_of_invention",
                input="the user provides negative feedback",
                output=reasoning,
            )
        ui.update_action_button(
            "save_reasoning_thumbs_down_field_of_invention", disabled=True)

    # Summary

    @reactive.Effect
    @reactive.event(input.thumbs_up_summary)
    def on_summary_thumbs_up():
        ui.update_action_button("thumbs_down_summary", disabled=True)
        ui.update_action_button("thumbs_up_summary", disabled=True)
        ui.notification_show("That's an Interesting Summary!",
                             duration=2,
                             type="message")

        trace = shared_state["summary_trace"]

        if trace:
            trace.update(metadata={"feedback": "positive"})
        print("thumbs up")

    @reactive.Effect
    @reactive.event(input.thumbs_down_summary)
    def on_summary_thumbs_down():
        ui.update_action_button("thumbs_up_summary", disabled=True)
        ui.update_action_button("thumbs_down_summary", disabled=True)
        ui.notification_show("Not the best summary 🤷🏽‍♂️",
                             duration=2,
                             type="error")

        trace = shared_state["summary_trace"]
        if trace:
            trace.update(metadata={"feedback": "negative"})
        print("thumbs down")

    @reactive.Effect()
    @reactive.event(input.summary)
    def on_summary_editable_content():
        print("watching changes...")
        if input.summary() != "":
            print("content changed!")
            ui.update_action_button("save_summary", disabled=False)

    @reactive.event(input.save_summary)
    def on_save_summary():
        print("save")

        summary_edit = input.summary()
        if ENVIRONMENT == "development":
            generated_summary.set(summary_edit)
        else:
            generated_summary.set(summary_edit)
            trace = shared_state["summary_trace"]
            if trace:
                trace.event(
                    name="edit_summary",
                    input=
                    "The input to this event is the summary generated by the LLM",
                    output=summary_edit,
                )
        ui.update_action_button("save_summary", disabled=True)

    @reactive.Effect
    @reactive.event(input.save_summary_comment)
    def on_save_summary_comment():
        print("save reasoning")
        reasoning = input.summary_comment()

        trace = shared_state["summary_trace"]
        if trace:
            trace.event(
                name="edit_reasoning_summary",
                input=
                "the user comments on the summary and the changes they made",
                output=reasoning,
            )

        ui.update_action_button("save_summary_comment", disabled=True)

    @reactive.Effect
    @reactive.event(input.save_reasoning_thumbs_down_summary)
    def on_save_reasoning_summary_thumbs_down():
        print("save thumbs down reasoning")
        reasoning = input.reasoning_thumbs_down_summary()
        trace = shared_state["summary_trace"]
        if trace:
            trace.event(
                name="thumbs_down_reasoning_summary",
                input="the user provides negative feedback",
                output=reasoning,
            )
        ui.update_action_button("save_reasoning_thumbs_down_summary",
                                disabled=True)

    # Primary invention feedback logic
    @reactive.Effect
    @reactive.event(input.thumbs_up_primary_invention)
    def on_primary_invention_thumbs_up():
        ui.update_action_button("thumbs_down_primary_invention", disabled=True)
        ui.update_action_button("thumbs_up_primary_invention", disabled=True)
        ui.notification_show("thumbs up_primary_invention",
                             duration=2,
                             type="message")

        trace = shared_state["primary_invention_trace"]

        if trace:
            trace.update(metadata={"feedback": "positive"})
        print("thumbs up")

    @reactive.Effect
    @reactive.event(input.thumbs_down_primary_invention)
    def on_primary_invention_thumbs_down():
        ui.update_action_button("thumbs_up_primary_invention", disabled=True)
        ui.update_action_button("thumbs_down_primary_invention", disabled=True)
        ui.notification_show("thumbs down_primary_invention",
                             duration=2,
                             type="error")

        trace = shared_state["primary_invention_trace"]
        if trace:
            trace.update(metadata={"feedback": "negative"})
        print("thumbs down")

    @reactive.Effect()
    @reactive.event(input.primary_invention)
    def on_primary_invention_editable_content():
        print("watching changes...")
        if input.primary_invention() != "":
            print("content changed!")
            ui.update_action_button("save_primary_invention", disabled=False)

    @reactive.event(input.save_primary_invention)
    def on_save_primary_invention():
        print("save")
        ui.update_action_button("save_primary_invention", disabled=True)

        primary_invention_edit = input.primary_invention()
        if ENVIRONMENT == "development":
            generated_primary_invention.set(primary_invention_edit)
        else:
            generated_primary_invention.set(primary_invention_edit)
            trace = shared_state["primary_invention_trace"]
            if trace:
                trace.event(
                    name="edit_primary_invention",
                    input=
                    "The input to this event is the primary invention generated by the LLM",
                    output=primary_invention_edit,
                )

    @reactive.Effect
    @reactive.event(input.save_primary_invention_comment)
    def on_save_primary_invention_comment():
        print("save reasoning")
        reasoning = input.save_primary_invention_comment()

        trace = shared_state["primary_invention_trace"]
        if trace:
            trace.event(
                name="edit_primary_invention_comment",
                input=
                "the user comments on the primary invention and the changes they made",
                output=reasoning,
            )

        ui.update_action_button("save_primary_invention_comment",
                                disabled=True)

    @reactive.Effect
    @reactive.event(input.save_reasoning_thumbs_down_primary_invention)
    def on_save_reasoning_primary_invention_thumbs_down():
        print("save thumbs down reasoning")
        reasoning = input.reasoning_thumbs_down_primary_invention()
        trace = shared_state["primary_invention_trace"]
        if trace:
            trace.event(
                name="thumbs_down_reasoning_primary_invention",
                input="the user provides negative feedback",
                output=reasoning,
            )
        ui.update_action_button("save_reasoning_thumbs_down_primary_invention",
                                disabled=True)

    # Technology

    @reactive.Effect
    @reactive.event(input.thumbs_up_technology)
    def on_technology_thumbs_up():
        ui.update_action_button("thumbs_down_technology", disabled=True)
        ui.update_action_button("thumbs_up_technology", disabled=True)
        ui.notification_show("That's an Interesting Technology!",
                             duration=2,
                             type="message")

        trace = shared_state["technology_trace"]

        if trace:
            trace.update(metadata={"feedback": "positive"})
        print("thumbs up")

    @reactive.Effect
    @reactive.event(input.thumbs_down_technology)
    def on_technology_thumbs_down():
        ui.update_action_button("thumbs_up_technology", disabled=True)
        ui.update_action_button("thumbs_down_technology", disabled=True)
        ui.notification_show("Not the best technology 🤷🏽‍♂️",
                             duration=2,
                             type="error")

        trace = shared_state["technology_trace"]
        if trace:
            trace.update(metadata={"feedback": "negative"})
        print("thumbs down")

    @reactive.Effect()
    @reactive.event(input.technology)
    def on_technology_editable_content():
        print("watching changes...")
        if input.technology() != "":
            print("content changed!")
            ui.update_action_button("save_technology", disabled=False)

    @reactive.event(input.save_technology)
    def on_save_technology():
        print("save")

        technology_edit = input.technology()
        if ENVIRONMENT == "development":
            generated_technology.set(technology_edit)
        else:
            generated_technology.set(technology_edit)
            trace = shared_state["technology_trace"]
            if trace:
                trace.event(
                    name="edit_technology",
                    input=
                    "The input to this event is the technology generated by the LLM",
                    output=technology_edit,
                )

    @reactive.Effect
    @reactive.event(input.save_technology_comment)
    def on_save_technology_comment():
        print("save reasoning")
        reasoning = input.technology_comment()

        trace = shared_state["technology_trace"]
        if trace:
            trace.event(
                name="edit_reasoning_technology",
                input=
                "the user comments on the technology and the changes they made",
                output=reasoning,
            )

        ui.update_action_button("save_technology_comment", disabled=True)

    @reactive.Effect
    @reactive.event(input.save_reasoning_thumbs_down_technology)
    def on_save_reasoning_technology_thumbs_down():
        print("save thumbs down reasoning")
        reasoning = input.reasoning_thumbs_down_technology()
        trace = shared_state["technology_trace"]
        if trace:
            trace.event(
                name="thumbs_down_reasoning_technology",
                input="the user provides negative feedback",
                output=reasoning,
            )
        ui.update_action_button("save_reasoning_thumbs_down_technology",
                                disabled=True)

    # description

    @reactive.Effect
    @reactive.event(input.thumbs_up_description)
    def on_description_thumbs_up():
        ui.update_action_button("thumbs_down_description", disabled=True)
        ui.update_action_button("thumbs_up_description", disabled=True)
        ui.notification_show("That's an Interesting Description!",
                             duration=2,
                             type="message")

        trace = shared_state["description_trace"]

        if trace:
            trace.update(metadata={"feedback": "positive"})
        print("thumbs up")

    @reactive.Effect
    @reactive.event(input.thumbs_down_description)
    def on_description_thumbs_down():
        ui.update_action_button("thumbs_up_description", disabled=True)
        ui.update_action_button("thumbs_down_description", disabled=True)
        ui.notification_show("Not the best description 🤷🏽‍♂️",
                             duration=2,
                             type="error")

        trace = shared_state["description_trace"]
        if trace:
            trace.update(metadata={"feedback": "negative"})
        print("thumbs down")

    @reactive.Effect()
    @reactive.event(input.description)
    def on_description_editable_content():
        print("watching changes...")
        if input.description() != "":
            print("content changed!")
            ui.update_action_button("save_description", disabled=False)

    @reactive.event(input.save_description)
    def on_save_description():
        print("save")

        description_edit = input.description()
        if ENVIRONMENT == "development":
            generated_description.set(description_edit)
        else:
            generated_description.set(description_edit)
            trace = shared_state["description_trace"]
            if trace:
                trace.event(
                    name="edit_description",
                    input=
                    "The input to this event is the description generated by the LLM",
                    output=description_edit,
                )

    @reactive.Effect
    @reactive.event(input.save_description_comment)
    def on_save_description_comment():
        print("save reasoning")
        reasoning = input.description_comment()

        trace = shared_state["description_trace"]
        if trace:
            trace.event(
                name="edit_reasoning_description",
                input=
                "the user comments on the description and the changes they made",
                output=reasoning,
            )

        ui.update_action_button("save_description_comment", disabled=True)

    @reactive.Effect
    @reactive.event(input.save_reasoning_thumbs_down_description)
    def on_save_reasoning_description_thumbs_down():
        print("save thumbs down reasoning")
        reasoning = input.reasoning_thumbs_down_description()
        trace = shared_state["description_trace"]
        if trace:
            trace.event(
                name="thumbs_down_reasoning_description",
                input="the user provides negative feedback",
                output=reasoning,
            )
        ui.update_action_button("save_reasoning_thumbs_down_description",
                                disabled=True)

    # Product
    @reactive.Effect
    @reactive.event(input.thumbs_up_product)
    def on_product_thumbs_up():
        ui.update_action_button("thumbs_down_product", disabled=True)
        ui.update_action_button("thumbs_up_product", disabled=True)
        ui.notification_show("That's an Interesting Product!",
                             duration=2,
                             type="message")

        trace = shared_state["product_trace"]

        if trace:
            trace.update(metadata={"feedback": "positive"})
        print("thumbs up")

    @reactive.Effect
    @reactive.event(input.thumbs_down_product)
    def on_product_thumbs_down():
        ui.update_action_button("thumbs_up_product", disabled=True)
        ui.update_action_button("thumbs_down_product", disabled=True)
        ui.notification_show("Not the best product 🤷🏽‍♂️",
                             duration=2,
                             type="error")

        trace = shared_state["product_trace"]
        if trace:
            trace.update(metadata={"feedback": "negative"})
        print("thumbs down")

    @reactive.Effect()
    @reactive.event(input.product)
    def on_product_editable_content():
        print("watching changes...")
        if input.product() != "":
            print("content changed!")
            ui.update_action_button("save_product", disabled=False)

    @reactive.event(input.save_product)
    def on_save_product():
        print("save")

        product_edit = input.product()
        if ENVIRONMENT == "development":
            generated_product.set(product_edit)
        else:
            generated_product.set(product_edit)
            trace = shared_state["product_trace"]
            if trace:
                trace.event(
                    name="edit_product",
                    input=
                    "The input to this event is the product generated by the LLM",
                    output=product_edit,
                )

    @reactive.Effect
    @reactive.event(input.save_product_comment)
    def on_save_product_comment():
        print("save reasoning")
        reasoning = input.product_comment()

        trace = shared_state["product_trace"]
        if trace:
            trace.event(
                name="edit_reasoning_product",
                input=
                "the user comments on the product and the changes they made",
                output=reasoning,
            )

        ui.update_action_button("save_product_comment", disabled=True)

    @reactive.Effect
    @reactive.event(input.save_reasoning_thumbs_down_product)
    def on_save_reasoning_product_thumbs_down():
        print("save thumbs down reasoning")
        reasoning = input.reasoning_thumbs_down_product()
        trace = shared_state["product_trace"]
        if trace:
            trace.event(
                name="thumbs_down_reasoning_product",
                input="the user provides negative feedback",
                output=reasoning,
            )
        ui.update_action_button("save_reasoning_thumbs_down_product",
                                disabled=True)


# Run App
app = shiny.App(app_ui, server)
app.run()
