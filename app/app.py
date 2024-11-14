from shiny import reactive, render, ui
import shiny
import asyncio
from make_patent_component import primary_invention
import logging


logging.basicConfig(level=logging.INFO)

# Define UI
app_ui = ui.page_fluid(
    ui.layout_sidebar(
        ui.sidebar(
            ui.input_text("antigen", "Enter Antigen"),
            ui.input_text("disease", "Enter Disease"),
            ui.input_action_button("generate", "Generate", class_="btn btn-primary"),
        ),
        ui.card(
            ui.output_ui("content_cards"),
            max_height="30%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        height="100vh",
    )
)


def generate_card_content(response_text):
    response_text = str(response_text)
    return ui.div(
        ui.div(
            ui.input_text_area("editable_content", "primary invention", value=response_text, width="100%"),
            class_="card-body h-25"
        ),
        ui.div(
            ui.input_action_button(
                "thumbs_up", "👍 ", class_="btn btn-success p-0", width="3vw"
            ),
            ui.input_action_button(
                "thumbs_down", "👎 ", class_="btn btn-danger p-0", width="3vw"
            ),
            ui.input_action_button(
                "save", "💾 ", class_="btn btn-secondary p-0", width="3vw", disabled=True
            ),
            class_="card-footer mt-2",
        ),
        class_="card h-100",
    )


# Define Server Logic
def server(input, output, session):
    # Create a reactive value to store the generated content
    generated_content = reactive.Value("")
    
    @reactive.Effect
    @reactive.event(input.generate)
    async def on_generate():
        # Collect input values
        antigen = input.antigen()
        disease = input.disease()

        # Call primary_invention function with await, passing input values
        response = f"{antigen} {disease}"

        # Debugging: Log the type and value of response
        logging.info(f"Type of response: {type(response)}")
        logging.info(f"Value of response: {response}")

        # Update reactive value
        generated_content.set(response)

    # Use render.ui to auto-refresh content when generated_content changes
    @output
    @render.ui
    def content_cards():
        return generate_card_content(generated_content())
    
    @reactive.Effect
    @reactive.event(input.thumbs_up)
    def on_thumbs_up():
        ui.update_action_button("thumbs_down", disabled=True)
        print("thumbs up")

    @reactive.Effect
    @reactive.event(input.thumbs_down)
    def on_thumbs_down():
        ui.update_action_button("thumbs_up", disabled=True)
        print("thumbs down")

    @reactive.Effect()
    @reactive.event(input.editable_content)
    def on_editable_content():
        print("watching changes...")
        if input.editable_content() != "":
            print("content changed!")
            ui.update_action_button("save", disabled=False)
        

    @reactive.Effect
    @reactive.event(input.save)
    def on_save():
        print("save")
        ui.update_action_button("save", disabled=True)

        primary_invention = input.editable_content()


# Run App
app = shiny.App(app_ui, server)
app.run()